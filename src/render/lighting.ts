import {dotProduct, normalizeVector, scaleVector, subtractVector, Vector} from "../utility/math-utility";

export interface SymbolColor {
    // ambient, diffuse, specular factor
    readonly blue: [number, number, number],
    readonly green: [number, number, number],
    readonly red: [number, number, number],
}
const colors = new Map<string, SymbolColor>();
// default white color
const DEFAULT_WHITE = "default.white";
colors.set(DEFAULT_WHITE, {
    red: [0.2, 0.5, 0.5],
    green: [0.2, 0.5, 0.5],
    blue: [0.2, 0.5, 0.5]
});
export function addColor(name: string, color: SymbolColor){
    console.log("color: ", name, color);
    colors.set(name, color);
}

// the vector the user is looking from
export const viewingVector: Vector = [0, 0, 1];
export function setViewingVector(x: number, y: number, z: number){
    viewingVector[0] = x;
    viewingVector[1] = y;
    viewingVector[2] = z;
}

// light
export const lightVector: Vector = [0.5, 0.75, 1];
export function setLightVector(x: number, y: number, z: number){
    viewingVector[0] = x;
    viewingVector[1] = y;
    viewingVector[2] = z;
}

// color of light
// value range from [0, 255]
export type Color = {
    red: number,
    green: number,
    blue: number
}
const ambientLightColor: Color = {
    red: 255,
    green: 255,
    blue: 255
};
const pointLightColor: Color = {
    red: 255,
    green: 255,
    blue: 255
};

export function calculateColor(surfaceNormal: Vector, colorName?: string): String{
    const color = colorName ? colors.get(colorName) : colors.get(DEFAULT_WHITE);
    const normalizedLightVector = normalizeVector(lightVector);
    const normalizedSurfaceNormal = normalizeVector(surfaceNormal);

    const diffuseReflectionFactor = Math.max(dotProduct(normalizedSurfaceNormal, normalizedLightVector), 0);

    const AMBIENT = 0;
    const DIFFUSE = 1;
    const SPECULAR = 2;

    // color = ambientColor + diffuseColor + specularColor
    const red = ambientLightColor.red * color.red[AMBIENT]
        + pointLightColor.red * color.red[DIFFUSE] * (diffuseReflectionFactor);
        + calculateSpecularColorValue(normalizedSurfaceNormal, normalizedLightVector, pointLightColor.red, color.red[SPECULAR]);
    const green = ambientLightColor.green * color.green[AMBIENT]
        + pointLightColor.green * color.green[DIFFUSE] * (diffuseReflectionFactor)
        + calculateSpecularColorValue(normalizedSurfaceNormal, normalizedLightVector, pointLightColor.green, color.green[SPECULAR]);
    const blue = ambientLightColor.blue * color.blue[AMBIENT]
        + pointLightColor.blue * color.blue[DIFFUSE] * (diffuseReflectionFactor)
        + calculateSpecularColorValue(normalizedSurfaceNormal, normalizedLightVector, pointLightColor.blue, color.blue[SPECULAR]);

    return `${Math.floor(red)} ${Math.floor(green)} ${Math.floor(blue)}`;
}

function calculateSpecularColorValue(normalizedSurfaceNormal: Vector, normalizedLightVector: Vector, colorValue: number, reflectionFactor: number): number {
    const reflectionVector = subtractVector(scaleVector(normalizedSurfaceNormal, 2 * dotProduct(normalizedSurfaceNormal, normalizedLightVector)), normalizedLightVector);
    const factor = dotProduct(reflectionVector, normalizeVector(viewingVector));
    if(factor < 0){
        // no reflection
        return 0;
    }
    const shininess = 4;
    return colorValue * reflectionFactor * Math.pow(factor, shininess);
}