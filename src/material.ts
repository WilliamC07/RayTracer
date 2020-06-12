import {
    addRay,
    dotProduct,
    random_in_unit_sphere,
    randomUnitRay,
    Ray,
    reflect,
    refract,
    scaleRay,
    unitRay
} from "./render/ray";
import {HitRecords} from "./render/hittable";
import {schlick} from "./utility/math-utility";

export abstract class Material {
    public abstract scatter(rayOrigin: Ray, rayDirection: Ray, hitRecords: HitRecords, scatterInfo: ScatterInfo): boolean;
}

export interface ScatterInfo{
    scatteredPosition: Ray, // scattered.p
    scatteredDirection: Ray,  // scattered.dir
    attenuation: Ray
}

export class LambertianDiffuse extends Material{
    private readonly color: Ray;

    constructor(color: Ray){
        super();
        this.color = color;
    }

    public scatter(rayOrigin: Ray, rayDirection: Ray, hitRecords: HitRecords, scatterInfo: ScatterInfo): boolean {
        const scatterDirection = addRay(hitRecords.normal, randomUnitRay());
        scatterInfo.scatteredPosition = hitRecords.positionOfIntersection;
        scatterInfo.scatteredDirection = scatterDirection;
        scatterInfo.attenuation = this.color;
        return true;
    }

}

export class Metal extends Material{
    private readonly color: Ray;
    private readonly fuzz: number;

    constructor(color: Ray, fuzz: number){
        super();
        this.color = color;
        this.fuzz = fuzz < 1 ? fuzz : 1;
    }

    scatter(rayOrigin: Ray, rayDirection: Ray, hitRecords: HitRecords, scatterInfo: ScatterInfo): boolean {
        const reflected: Ray = reflect(unitRay(rayDirection), hitRecords.normal);
        scatterInfo.scatteredPosition = hitRecords.positionOfIntersection;
        scatterInfo.scatteredDirection = addRay(reflected, scaleRay(random_in_unit_sphere(), this.fuzz));
        scatterInfo.attenuation = this.color;
        return dotProduct(reflected, hitRecords.normal) > 0;
    }
}

export class Dielectric extends Material {
    private readonly reflectionIndex: number;

    /**
     *
     * @param reflectionIndex Make negative radius of sphere for hollow glass sphere, positive for glass
     */
    constructor(reflectionIndex: number){
        super();
        this.reflectionIndex = reflectionIndex;
    }

    scatter(rayOrigin: Ray, rayDirection: Ray, hitRecords: HitRecords, scatterInfo: ScatterInfo): boolean {
        scatterInfo.attenuation = [1, 1, 1];
        let etaiOverEtat: number = this.reflectionIndex;
        if(hitRecords.isFrontFace){
            etaiOverEtat = 1 / this.reflectionIndex
        }


        const unitDirection = unitRay(rayDirection);
        const cosTheta = Math.min(dotProduct(scaleRay(unitDirection, -1), hitRecords.normal), 1);
        const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
        if(etaiOverEtat * sinTheta > 1){
            const reflected = reflect(unitDirection, hitRecords.normal);
            scatterInfo.scatteredPosition = hitRecords.positionOfIntersection;
            scatterInfo.scatteredDirection = reflected;
            return true;
        }

        const reflectProb = schlick(cosTheta, etaiOverEtat);
        if(Math.random() < reflectProb){
            const reflected = reflect(unitDirection, hitRecords.normal);
            scatterInfo.scatteredPosition = hitRecords.positionOfIntersection;
            scatterInfo.scatteredDirection = reflected;
            return true;
        }

        const refracted = refract(unitDirection, hitRecords.normal, etaiOverEtat);
        scatterInfo.scatteredPosition = hitRecords.positionOfIntersection;
        scatterInfo.scatteredDirection = refracted;
        return true;
    }
}