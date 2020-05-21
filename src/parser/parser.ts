import {
    addEdge, createEdgeMatrix, createPolygonMatrix,
    EdgeMatrix,
    multiplyEdgeMatrix, PolygonMatrix,
    toInteger,
} from "../matrix";
import {
    toIdentity,
    toMove,
    toRotate,
    Axis,
    toScale,
    Transformer,
    createTransformer, deepCopyTransformer
} from "../transformations";
import Image from "../image";
import {bezierCurve, drawCircle, hermiteCurve, drawBox, drawSphere, drawTorus} from "../render/draw";
import {objParser} from "./obj-parser";
import {exec, spawn} from "child_process";
import path from 'path'
import {SymbolColor} from "../render/lighting";
import fs from 'fs';

// MDL file typings
interface MDLCommand {
    readonly args: null|number[]|string[],
    readonly op: string,
    readonly constants?: string, // refer to MDLSymbol
    readonly knob?: string|null,
    readonly cs?: string|null,
}
type MDLSymbol = [
    string, // "constants"
    {
        // ambient, diffuse, specular factor
        readonly blue: [number, number, number],
        readonly green: [number, number, number],
        readonly red: [number, number, number],
    }
]
interface MDLObject {
    readonly commands: MDLCommand[],
    readonly symbols: {
        readonly [constantName: string]: MDLSymbol
    }
}

const symbols = new Map<string, SymbolColor>();
// default value if no color is chosen by the mdl file
const DEFAULT_WHITE = "default.white";
symbols.set(DEFAULT_WHITE, {
    red: [0.2, 0.5, 0.5],
    green: [0.2, 0.5, 0.5],
    blue: [0.2, 0.5, 0.5]
});

function parseMDLFile(fileName: string){
    const filePath = path.join(process.cwd(), fileName);
    // parse the mdl file and convert it into a json
    spawn("python3", ["./src/parser/ply/main.py", filePath]).stdout.on("data", (data) => {
        data = data.toString();

        if(data.includes("ERROR")){
            const errorMessage = data.split("\n")[0];
            printAndDie("Failed to parse the MDL file:" + errorMessage);
        }

        parseMDLJSON(JSON.parse(data));
    });
}
export default parseMDLFile;

function parseMDLJSON(parsedMDL: MDLObject){
    // parse symbols

    const isAnimation = checkIfMDLIsAnimation(parsedMDL);

    // make sure we have all the commands required if the mdl file is an animation type
    if(isAnimation){
        parseAnimationMDL(parsedMDL);
    }else{
        parseStaticMDL(parsedMDL);
    }
}

function checkIfMDLIsAnimation(parsedMDL: MDLObject): boolean{
    const animationCommandOperations = ["frames", "basename", "vary"];
    for(const command of parsedMDL.commands){
        if(animationCommandOperations.includes(command.op)){
            return true;
        }
    }

    return false;
}

function parseAnimationMDL(parsedMDL: MDLObject){
    let frames = 0;
    let basename = "";
    let varyCommands: MDLCommand[] = [];
    let knobsForFrame: Map<string, number>[];

    /* parse the symbols out of the MDL */
    for(const [symbolName, values] of Object.entries(parsedMDL.symbols)){
        // remove the "constants" entry
        if(values[0] === "constants"){
            // example of values[1]: 0.3
            symbols.set(symbolName, values[1]);
        }
    }

    /* Get initializing data (frames, basename, and vary commands) from MDL file */
    for(const command of parsedMDL.commands){
        switch(command.op){
            case 'frames':
                frames = (command.args as number[])[0];
                // each frame should keep track of knob values
                knobsForFrame = new Array(frames);
                for(let frame = 0; frame < frames; frame++){
                    knobsForFrame[frame] = new Map();
                }
                break;
            case 'basename':
                basename = (command.args as string[])[0];
                break;
            case 'vary':
                varyCommands.push(command);
                break;
        }
    }

    /* Make sure we get all the initializing data */
    const errors: string[] = [];
    if(frames === 0){
        errors.push("No frames set.");
    }
    if(basename === ""){
        errors.push("No basename set.");
    }
    if(varyCommands.length === 0){
        console.log("\x1b[33m", "No vary commands");
    }
    if(errors.length !== 0){
        printAndDie(errors.join("\n"));
    }

    /* Generate a table of knob values for each frame */
    for(const varyCommand of varyCommands){
        const [startFrame, endFrame, startValue, endValue] = (varyCommand.args as number[]);
        if(startFrame > endFrame){
            printAndDie("Start frame must come before the end frame: vary for " + varyCommand.knob as string);
        }

        const step = (endValue - startValue) / (endFrame - startFrame);
        let currentValue = startValue;
        for(let frame = startFrame; frame <= endFrame; frame++) {
            knobsForFrame[frame].set(varyCommand.knob, currentValue);
            currentValue += step;
        }
    }

    const fileCreatedPromises = generateImage(parsedMDL, frames, knobsForFrame, basename);

    /* Create a gif from the created images */
    Promise.all(fileCreatedPromises).then(() => {
        // create the gif
        console.log("Converting images to gif");
        // convert to gif and display
        exec(`convert -delay 10 animation/${basename}{0..${frames - 1}}.ppm ${basename}.gif && animate ${basename}.gif`);
    }).catch((error) => {
        printAndDie("Failed to write to disk all the images: \n" + error.message);
    })
}

function parseStaticMDL(parsedMDL: MDLObject){
    // a static image can be thought of as a single frame animation
    generateImage(parsedMDL, 1);
}

function generateImage(parsedMDL: MDLObject, frames: number, knobsForFrame?: Map<string, number>[], basename?: string): Promise<void>[] {
    const polygonMatrix = createPolygonMatrix();
    const image = new Image(500, 500);
    const fileWritingPromises: Promise<void>[] = [];

    for (let frame = 0; frame < frames; frame++) {
        const transformationStack: Transformer[] = [createTransformer()];  // initialize with identity transformation
        console.log("frame", frame);
        for (const command of parsedMDL.commands) {
            const currentTransformation = transformationStack[transformationStack.length - 1];
            switch (command.op) {
                // constants are parsed out already
                case 'constants':
                    break;

                // 3d shapes
                case 'sphere':
                    sphere(command.args as number[], symbols.get(command.constants), polygonMatrix, currentTransformation, image);
                    break;
                case 'box':
                    box(command.args as number[], symbols.get(command.constants), polygonMatrix, currentTransformation, image);
                    break;
                case 'torus':
                    torus(command.args as number[], symbols.get(command.constants), polygonMatrix, currentTransformation, image);
                    break;
                case 'mesh':
                    mesh(symbols.get(command.constants), (command.args as string[])[0], polygonMatrix, currentTransformation, image);
                    break;

                // transformation
                case 'push':
                    push(transformationStack);
                    break;
                case 'pop':
                    pop(transformationStack);
                    break;
                case 'move':
                    move(command.args as number[], currentTransformation, command.knob, knobsForFrame?.[frame]);
                    break;
                case 'rotate':
                    rotate(command.args, currentTransformation, command.knob, knobsForFrame?.[frame]);
                    break;
                case 'scale':
                    scale(command.args, currentTransformation, command.knob, knobsForFrame?.[frame]);
                    break;

                // controls
                case 'display':
                    image.display();
                    break;
                case 'save':
                    save((command.args as string[])[0], image);
                    break;
                case 'clear':
                    clear(polygonMatrix, image);
                    break;

                // ignore these animation details since they were handled earlier
                case 'frames':
                    break;
                case 'basename':
                    break;
                case 'vary':
                    break;

                default: {
                    throw new Error("Failed to parse: " + command.op);
                }
            }
        }

        // save animation frame separately since animation does not use "save" operation
        if (frames > 1) {
            const directory = "animation";
            fileWritingPromises.push(image.saveToDisk(path.join(directory, basename + frame + ".ppm")));
            // clear the old frame
            clear(polygonMatrix, image);
        }
    }

    return fileWritingPromises;
}

function mesh(color: SymbolColor, fileName: string, polygonMatrix: PolygonMatrix, transformer: Transformer, image: Image){
    if(fileName.endsWith(".obj")){
        objParser(fileName, polygonMatrix);
        multiplyEdgeMatrix(transformer, polygonMatrix);
        draw(image, polygonMatrix, color);
    }
}

function box(args: number[], color: SymbolColor, polygonMatrix: PolygonMatrix, transformer: Transformer, image: Image){
    const [x, y, z, width, height, depth] = args;
    drawBox(x, y, z, width, height, depth, polygonMatrix);
    multiplyEdgeMatrix(transformer, polygonMatrix);
    draw(image, polygonMatrix, color);
}

function clear(polygonMatrix: PolygonMatrix, image: Image){
    polygonMatrix.length = 0;
    image.clear();
}

/**
 * Adds the move transformation to the transformer
 * @param args [x, y, z]
 * @param transformer Transformer to be modified
 * @param knob
 */
function move(args: number[], transformer: Transformer, knob?: string|null, knobsForFrame?: Map<string, number>){
    let [x, y, z] = args;
    if(knob && knobsForFrame.has(knob)){
        x *= knobsForFrame.get(knob);
        y *= knobsForFrame.get(knob);
        z *= knobsForFrame.get(knob);
    }
    toMove(transformer, x, y, z);
}

/**
 * Adds the rotate transformation to the transformer
 * @param args ["x"|"y"|"z", degrees]
 * @param transformer
 * @param knob
 */
function rotate(args: any[], transformer: Transformer, knob?: string|null, knobsForFrame?: Map<string, number>){
    const axis = args[0] as keyof typeof Axis;
    let degrees = args[1];
    if(knob && knobsForFrame.has(knob)){
        degrees *= knobsForFrame.get(knob);
    }
    toRotate(transformer, degrees, Axis[axis]);
}

/**
 * Adds the scale transformation to the transformer
 * @param args [x, y, z]
 * @param transformer
 * @param knob
 */
function scale(args: any[], transformer: Transformer, knob?: string|null, knobsForFrame?: Map<string, number>){
    let [x, y, z] = args;
    if(knob && knobsForFrame.has(knob)){
        x *= knobsForFrame.get(knob);
        y *= knobsForFrame.get(knob);
        z *= knobsForFrame.get(knob);
    }
    toScale(transformer, x, y, z);
}

function sphere(args: number[], color: SymbolColor, polygonMatrix: PolygonMatrix, transformer: Transformer, image: Image, cs?: string){
    const [x, y, z, radius] = args;
    drawSphere(polygonMatrix, x, y, z, radius);
    multiplyEdgeMatrix(transformer, polygonMatrix);
    draw(image, polygonMatrix, color);
}

function torus(args: number[], color: SymbolColor, polygonMatrix: PolygonMatrix, transformer: Transformer, image: Image){
    const [x, y, z, radius1, radius2] = args;
    drawTorus(polygonMatrix, x, y, z, radius1, radius2);
    multiplyEdgeMatrix(transformer, polygonMatrix);
    draw(image, polygonMatrix, color);
}

function pop(transformationStack: Transformer[]){
    transformationStack.pop();
}

function push(transformationStack: Transformer[]){
    // push deep copy on
    const peekStack: Transformer = transformationStack[transformationStack.length - 1];
    transformationStack.push(deepCopyTransformer(peekStack));
}

function save(fileName: string, image: Image){
    if(!fileName.endsWith(".png")){
        fileName += ".png";
    }
    console.log("saving as", fileName);
    image.saveToDisk(fileName);
    image.clear();
}

function draw(image: Image, polygonMatrix: PolygonMatrix, symbolColor: SymbolColor){
    if(symbolColor == undefined){
        symbolColor = symbols.get(DEFAULT_WHITE);
    }
    toInteger(polygonMatrix);
    image.drawPolygons(polygonMatrix, symbolColor);
    // clear polygon drawn
    polygonMatrix.length = 0;
}

function printAndDie(message: string){
    console.log("\x1b[31m", message);
    console.log("\x1b[31m", "exiting");
    process.exit();
}