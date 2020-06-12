import {Point, PolygonMatrix} from "../matrix";
import {calculateSurfaceNormal, randomNumber} from "../utility/math-utility";

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

export function randomRay(): Ray{
    return [Math.random(), Math.random(), Math.random()]
}

export function randomRangedRay(min: number, max: number): Ray{
    return [randomNumber(min, max), randomNumber(min, max), randomNumber(min, max)]
}

export function randomUnitRay(): Ray{
    // lambertian distribution
    const a = randomNumber(0, 2*Math.PI);
    const z = randomNumber(-1, 1);
    const r = Math.sqrt(1 - z * z);
    return [r * Math.cos(a), r * Math.sin(a), z];
}

export function random_in_unit_sphere(){
    while(true){
        const ray = randomRangedRay(-1, 1);
        if(rayLengthSquared(ray) >= 1){
            continue;
        }
        return ray;
    }
}

/**
 *
 * @param v Ray to be reflected
 * @param n Normal to surface reflected off of. Unit Vector
 */
export function reflect(v: Ray, n: Ray){
    return subtractRay(v, scaleRay(n, 2 * dotProduct(v, n)))
}