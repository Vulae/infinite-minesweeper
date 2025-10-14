// https://github.com/caseman/noise/blob/master/_perlin.c

import { hashNormalized, Splitmax32 } from './noise';

type InterpFunc = (a: number, b: number, t: number) => number;

export class PerlinNoiseSampler {
    public readonly seed: number;
    public constructor(seed: number) {
        this.seed = seed;
    }

    public static readonly INTERP_LINEAR: InterpFunc = (a: number, b: number, t: number) => {
        return (b - a) * t + a;
    };
    public static readonly INTERP_QUADRADIC: InterpFunc = (a: number, b: number, t: number) => {
        return (b - a) * (3.0 - t * 2.0) * t * t + a;
    };
    public static readonly INTERP_QUINTIC: InterpFunc = (a: number, b: number, t: number) => {
        return (b - a) * ((t * (t * 6.0 - 15.0) + 10.0) * t * t * t) + a;
    };

    public interpFunc: InterpFunc = PerlinNoiseSampler.INTERP_QUINTIC;

    /**
     * @returns -1 to 1
     */
    public noise1(x: number): number {
        const dotGridGradient = (ix: number, x: number): number => {
            const dx = x - ix;

            const gx = hashNormalized(this.seed, ix) > 0.5 ? 1 : -1;

            return dx * gx;
        };

        const x0 = Math.floor(x);
        const x1 = x0 + 1;

        const sx = x - x0;

        return this.interpFunc(dotGridGradient(x0, x), dotGridGradient(x1, x), sx);
    }

    /**
     * @returns -1 to 1
     */
    public noise2(x: number, y: number): number {
        const dotGridGradient = (ix: number, iy: number, x: number, y: number): number => {
            const dx = x - ix;
            const dy = y - iy;

            const angle = hashNormalized(this.seed, ix, iy) * Math.PI * 2;
            const gx = Math.cos(angle);
            const gy = Math.sin(angle);

            return dx * gx + dy * gy;
        };

        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const sx = x - x0;
        const sy = y - y0;

        return this.interpFunc(
            this.interpFunc(dotGridGradient(x0, y0, x, y), dotGridGradient(x1, y0, x, y), sx),
            this.interpFunc(dotGridGradient(x0, y1, x, y), dotGridGradient(x1, y1, x, y), sx),
            sy
        );
    }

    /**
     * @returns -1 to 1
     */
    public noise3(x: number, y: number, z: number): number {
        const dotGridGradient = (
            ix: number,
            iy: number,
            iz: number,
            x: number,
            y: number,
            z: number
        ): number => {
            const dx = x - ix;
            const dy = y - iy;
            const dz = z - iz;

            const random = new Splitmax32(this.seed);
            const angle = random.float() * Math.PI * 2;
            const vz = random.float() * 2 - 1;
            const vzBase = Math.sqrt(1 - vz * vz);
            const gx = vz;
            const gy = vzBase * Math.cos(angle);
            const gz = vzBase * Math.sin(angle);

            return dx * gx + dy * gy + dz * gz;
        };

        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const z0 = Math.floor(z);
        const x1 = x0 + 1;
        const y1 = y0 + 1;
        const z1 = z0 + 1;

        const sx = x - x0;
        const sy = y - y0;
        const sz = z - z0;

        return this.interpFunc(
            this.interpFunc(
                this.interpFunc(
                    dotGridGradient(x0, y0, z0, x, y, z),
                    dotGridGradient(x1, y0, z0, x, y, z),
                    sx
                ),
                this.interpFunc(
                    dotGridGradient(x0, y1, z0, x, y, z),
                    dotGridGradient(x1, y1, z0, x, y, z),
                    sx
                ),
                sy
            ),
            this.interpFunc(
                this.interpFunc(
                    dotGridGradient(x0, y0, z1, x, y, z),
                    dotGridGradient(x1, y0, z1, x, y, z),
                    sx
                ),
                this.interpFunc(
                    dotGridGradient(x0, y1, z1, x, y, z),
                    dotGridGradient(x1, y1, z1, x, y, z),
                    sx
                ),
                sy
            ),
            sz
        );
    }

    public persistence: number = 0.5;
    public lacunarity: number = 2;

    private perlinAccumulator(octaves: number, noiseCallback: (freq: number) => number): number {
        let acc: number = 0;
        let max: number = 0;
        let freq: number = 1;
        let amp: number = 1;

        for (let i = 0; i < octaves; i++) {
            acc += noiseCallback(freq) * amp;
            max += amp;
            freq *= this.lacunarity;
            amp *= this.persistence;
        }

        return acc / max;
    }

    /**
     * @returns 0 to 1
     */
    public perlin1(x: number, octaves: number = 1): number {
        return this.perlinAccumulator(octaves, (freq) => (this.noise1(x * freq) + 1) * 0.5);
    }

    /**
     * @returns 0 to 1
     */
    public perlin2(x: number, y: number, octaves: number = 1): number {
        return this.perlinAccumulator(
            octaves,
            (freq) => (this.noise2(x * freq, y * freq) + 1) * 0.5
        );
    }

    /**
     * @returns 0 to 1
     */
    public perlin3(x: number, y: number, z: number, octaves: number = 1): number {
        return this.perlinAccumulator(
            octaves,
            (freq) => (this.noise3(x * freq, y * freq, z * freq) + 1) * 0.5
        );
    }
}
