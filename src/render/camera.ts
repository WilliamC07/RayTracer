import {addRay, Ray, scaleRay, subtractRay} from "./ray";

export default class Camera {
    private origin: Ray;
    private focalLength: number;

    private horizontalRay: Ray;
    private verticalRay: Ray;
    private lowerLeftCornerRay: Ray;

    private viewportHeight: number;
    private viewportWidth: number;

    constructor(){
        this.origin = [0, 0, 0];
        this.focalLength = 1;

        this.viewportHeight = 2;
        this.viewportWidth = 2;

        this.horizontalRay = [this.viewportWidth, 0, 0];
        this.verticalRay = [0, this.viewportHeight, 0];

        const scaledHorizontal = scaleRay(this.horizontalRay, .5);
        const scaledVertical = scaleRay(this.verticalRay, .5);
        this.lowerLeftCornerRay = subtractRay(this.origin, scaledHorizontal);
        this.lowerLeftCornerRay = subtractRay(this.lowerLeftCornerRay, scaledVertical);
        this.lowerLeftCornerRay = subtractRay(this.lowerLeftCornerRay, [0, 0, this.focalLength]);
    }

    getRay(u: number, v: number): Ray {
        let ray = addRay(this.lowerLeftCornerRay, scaleRay(this.horizontalRay, u));
        ray = addRay(ray, scaleRay(this.verticalRay, v));
        ray = subtractRay(ray, this.origin);

        return ray;
    }
}
