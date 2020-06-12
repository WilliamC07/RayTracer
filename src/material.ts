import {addRay, dotProduct, randomUnitRay, Ray, reflect, unitRay} from "./render/ray";
import {HitRecords} from "./render/hittable";

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

    constructor(color: Ray){
        super();
        this.color = color;
    }

    scatter(rayOrigin: Ray, rayDirection: Ray, hitRecords: HitRecords, scatterInfo: ScatterInfo): boolean {
        const reflected: Ray = reflect(unitRay(rayDirection), hitRecords.normal);
        scatterInfo.scatteredPosition = hitRecords.positionOfIntersection;
        scatterInfo.scatteredDirection = reflected;
        scatterInfo.attenuation = this.color;
        return dotProduct(reflected, hitRecords.normal) > 0;
    }
}