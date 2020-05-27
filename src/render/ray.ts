import {Point, PolygonMatrix} from "../matrix";

export type Ray = [number, number, number];

export function addRay(u: Ray, v: Ray): Ray{
    return [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
}

export function subtractRay(u: Ray, v: Ray): Ray{
    return [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
}

export function multiplyRay(u: Ray, v: Ray): Ray{
    return [u[0] * v[0], u[1] * v[1], u[2] * v[2]];
}

export function scaleRay(u: Ray, scalar: number): Ray{
    return [scalar * u[0], scalar * u[1], scalar * u[2]];
}

export function dotProduct(u: Ray, v: Ray): number{
    return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

export function crossProduct(u: Ray, v: Ray): Ray{
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}

export function unitRay(u: Ray): Ray{
    const length = rayLength(u);
    return [u[0] / length, u[1] / length, u[2] / length];
}

export function rayLength(u: Ray): number{
    return Math.sqrt(rayLengthSquared(u));
}

export function rayLengthSquared(u: Ray): number{
    return u[0] * u[0] + u[1] * u[1] + u[2] * u[2]
}

/**
 * P(t) = A + tb
 *
 * P(T) = 3D position along the ray
 * A = Starting ray
 * t = distance (think of how you use t in parametric equations). Negative means moving backwards of direction, positive
 *     mean moving in direction of the direction ray
 * b = direction ray (extends ray A by this direction ray by a factor of t)
 * @param ray
 * @param direction
 * @param t
 */
export function rayAtTime(ray: Ray, direction: Ray, t: number){
    return addRay(ray, scaleRay(direction, t));
}

/**
 *
 * @param polygonMatrix All polygons on the scene
 * @param polygonIndex Index of the triangle to check if the ray intersects
 * @param ray Ray used for line of sight
 * @return true if ray does intersect, false other wise
 */
export function doesIntersectPolygon(polygonMatrix: PolygonMatrix, polygonIndex: number, ray: Ray): boolean{

    return false;
}

export function calculateRayColor(ray: Ray){

}