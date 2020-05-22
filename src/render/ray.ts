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