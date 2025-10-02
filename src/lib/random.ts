export class Splitmax32 {
    private accumulator: number;
    public constructor(accumulator: number) {
        this.accumulator = accumulator | 0;
    }

    public int(): number {
        this.accumulator = (this.accumulator + 0x9e3779b9) | 0;
        let t = this.accumulator ^ (this.accumulator >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        const v = (t = t ^ (t >>> 15)) >>> 0;
        return v;
    }

    public float(): number {
        return this.int() / 4294967296;
    }
}

export function hash(seed: number, ...nums: number[]): number {
    let h = seed | 0;
    for (const n of nums) {
        h = (h ^ n) | 0;
        h = Math.imul(h, 0x5bd1e995) | 0;
        h = (h + 0x6c078965) | 0;
        h = (h ^ (h >>> 16)) | 0;
    }
    return h >>> 0;
}

export function hashNormalized(seed: number, ...nums: number[]): number {
    return hash(seed, ...nums) / 4294967296;
}

function weightIndex(weights: number[], value: number): number {
    value *= weights.reduce((total, weight) => total + weight, 0);
    for (let i = 0; i < weights.length; i++) {
        value -= weights[i];
        if (value <= 0) {
            return i;
        }
    }
    throw new Error('Invalid weights');
}

export function voronoi_noise2d(seed: number, x: number, y: number, weights: number[]): number {
    let closestDist = Infinity;
    let closestType = -1;

    for (let i = Math.floor(x) - 1; i < Math.ceil(x) + 1; i++) {
        for (let j = Math.floor(y) - 1; j < Math.ceil(y) + 1; j++) {
            const pointX = i + hashNormalized(seed, i, j, 0) - 0.5;
            const pointY = j + hashNormalized(seed, i, j, 1) - 0.5;

            const dist = (pointX - x) ** 2 + (pointY - y) ** 2;

            if (dist < closestDist) {
                closestDist = dist;
                closestType = weightIndex(weights, hashNormalized(seed, i, j, 2));
            }
        }
    }

    if (closestType == -1) {
        throw new Error('Voronoi noise error.');
    }

    return closestType;
}

export function perlin_noise2d(seed: number, x: number, y: number): number {
    function interpolate(a: number, b: number, t: number): number {
        // return (b - a) * t + a;
        // return (b - a) * (3.0 - t * 2.0) * t * t + a;
        return (b - a) * ((t * (t * 6.0 - 15.0) + 10.0) * t * t * t) + a;
    }

    const dotGridGradient = (ix: number, iy: number, x: number, y: number): number => {
        const dx = x - ix;
        const dy = y - iy;
        const gradientAngle = hashNormalized(seed, ix, iy) * 2 * Math.PI;
        const gx = Math.cos(gradientAngle);
        const gy = Math.sin(gradientAngle);
        return dx * gx + dy * gy;
    };

    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const sx = x - x0;
    const sy = y - y0;

    const value = interpolate(
        interpolate(dotGridGradient(x0, y0, x, y), dotGridGradient(x1, y0, x, y), sx),
        interpolate(dotGridGradient(x0, y1, x, y), dotGridGradient(x1, y1, x, y), sx),
        sy
    );

    return value;
}
