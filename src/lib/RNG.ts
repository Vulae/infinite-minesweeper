
import { VanillaTile, type Tile } from "./Tile";



// https://stackoverflow.com/questions/521295#answer-47593316
function splitmix32(a: number, normalRange: boolean): () => number {
    return (): number => {
        a |= 0;
        a = a + 0x9E3779B9 | 0;
        let t = a ^ a >>> 16;
        t = Math.imul(t, 0x21F0AAAD);
        t = t ^ t >>> 15;
        t = Math.imul(t, 0x735A2D97);
        const v = (t = t ^ t >>> 15) >>> 0;
        return (normalRange ? (v / 4294967296) : v);
    }
}

// https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function
// I have no clue how this works, but it seems to be what I need?
function sfc_hash(seed: number, x: number, y: number, z: number): number {
    const a = 0x80AA1723;
    const b = 0xC6B272FD;
  
    seed ^= (seed << 13) | (seed >>> 17);
    seed = (seed * a + b) & 0xFFFFFFFF;
    seed ^= x;
  
    seed ^= (seed << 13) | (seed >>> 17);
    seed = (seed * a + b) & 0xFFFFFFFF;
    seed ^= y;

    seed ^= (seed << 13) | (seed >>> 17);
    seed = (seed * a + b) & 0xFFFFFFFF;
    seed ^= z;
  
    seed ^= (seed << 16) | (seed >>> 15);
    seed = (seed * a + b) & 0xFFFFFFFF;
  
    return (seed >>> 0) / 0xFFFFFFFF;
}



export class WorldRNG {
    public readonly seed: number;
    private readonly seedTile: number;

    public constructor(seed: number) {
        this.seed = seed;
        const rng = splitmix32(this.seed, false);
        this.seedTile = rng();
    }

    public tileRNG(x: number, y: number, index: number): number {
        return sfc_hash(this.seedTile, x, y, index);
    }
}


