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

    public bool(chance: number = 0.5): boolean {
        return this.float() <= chance;
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
