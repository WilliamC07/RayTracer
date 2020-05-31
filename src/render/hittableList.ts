import {HitRecords, Hittable} from "./hittable";
import {Ray} from "./ray";

export default class HittableList {
    private hittables: Hittable[];

    constructor() {
        this.hittables = [];
    }

    clear(){
        this.hittables.length = 0;
    }

    add(object: Hittable){
        this.hittables.push(object);
    }

    hit(origin: Ray, direction: Ray, tMin: number, tMax: number, hitRecords: HitRecords){
        const tempRecords: HitRecords = {
            faceNormal: undefined,
            isFrontFace: false,
            normal: undefined,
            positionOfIntersection: undefined,
            time: 0
        };
        let hasHitSomething = false;
        let closestIntersectionTime = tMax;

        for(const object of this.hittables){
            if(object.hit(origin, direction, tMin, closestIntersectionTime, tempRecords)){
                hasHitSomething = true;
                closestIntersectionTime = tempRecords.time;
                Object.assign(hitRecords, tempRecords);
            }
        }

        return hasHitSomething;
    }
}