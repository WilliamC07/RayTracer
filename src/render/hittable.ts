import {dotProduct, Ray, rayAtTime, rayLengthSquared, scaleRay, subtractRay} from "./ray";
import {Material} from "../material";

export interface HitRecords {
    time: number;
    positionOfIntersection: Ray;
    normal: Ray,
    material: Material,
    isFrontFace: boolean,
    faceNormal: Ray,
}

/**
 * Determine if the intersection is from "inside" the sphere or hitting the outside surface of the sphere.
 * @param origin
 * @param direction
 * @param outwardNormal
 * @param hitRecords
 */
function calculateFaceNormal(origin: Ray, direction: Ray, outwardNormal: Ray, hitRecords: HitRecords){
    hitRecords.isFrontFace = dotProduct(direction, outwardNormal) < 0;
    hitRecords.normal = hitRecords.isFrontFace ? outwardNormal : scaleRay(outwardNormal, -1);
}

export abstract class Hittable {
    public abstract hit(origin: Ray, direction: Ray, tMin: number, tMax: number, hitRecords: HitRecords): boolean;
}

export class Sphere extends Hittable {
    private readonly center: Ray;
    private readonly radius: number;
    private readonly material: Material;

    constructor(center: Ray, radius: number, material: Material){
        super();
        this.center = center;
        this.radius = radius;
        this.material = material;
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
                hitRecords.material = this.material;
                const outwardNormal = scaleRay(subtractRay(hitRecords.positionOfIntersection, this.center), 1/this.radius);
                calculateFaceNormal(origin, direction, outwardNormal, hitRecords);

                return true;
            }
            time = (-half_b + root) / a;
            if(time < tMax && time > tMin){
                hitRecords.time = time;
                hitRecords.positionOfIntersection = rayAtTime(origin, direction, time);
                hitRecords.normal = scaleRay(subtractRay(hitRecords.positionOfIntersection, this.center), 1/this.radius);
                hitRecords.material = this.material;
                const outwardNormal = scaleRay(subtractRay(hitRecords.positionOfIntersection, this.center), 1/this.radius);
                calculateFaceNormal(origin, direction, outwardNormal, hitRecords);

                return true;
            }
        }

        return false;
    }
}