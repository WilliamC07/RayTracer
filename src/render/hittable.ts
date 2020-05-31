import {dotProduct, Ray, rayAtTime, rayLengthSquared, scaleRay, subtractRay} from "./ray";

export interface HitRecords {
    time: number;
    positionOfIntersection: Ray;
    normal: Ray
}

export abstract class Hittable {
    public abstract hit(origin: Ray, direction: Ray, tMin: number, tMax: number, hitRecords: HitRecords): boolean;
}

export class Sphere extends Hittable {
    private readonly center: Ray;
    private readonly radius: number;

    constructor(center: Ray, radius: number){
        super();
        this.center = center;
        this.radius = radius;
    }

    public hit(origin: Ray, direction: Ray, tMin: number, tMax: number, hitRecords: HitRecords): boolean {
        // quadratic formula to determine if ray intersects sphere
        const oc = subtractRay(origin, this.center);
        const a = rayLengthSquared(direction);
        const half_b = dotProduct(oc, direction);
        const c = rayLengthSquared(oc) - this.radius * this.radius;
        const discriminant = half_b * half_b - a * c;

        if(discriminant > 0){
            const root = Math.sqrt(discriminant);
            let time = (-half_b - root) / a;
            if(time < tMax && time > tMin){
                hitRecords.time = time;
                hitRecords.positionOfIntersection = rayAtTime(origin, direction, time);
                hitRecords.normal = scaleRay(subtractRay(hitRecords.positionOfIntersection, this.center), 1/this.radius);
                return true;
            }
            time = (-half_b + root) / a;
            if(time < tMax && time > tMin){
                hitRecords.time = time;
                hitRecords.positionOfIntersection = rayAtTime(origin, direction, time);
                hitRecords.normal = scaleRay(subtractRay(hitRecords.positionOfIntersection, this.center), 1/this.radius);
                return true;
            }
        }

        return false;
    }
}