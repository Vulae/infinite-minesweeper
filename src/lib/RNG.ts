


// https://stackoverflow.com/questions/521295#answer-47593316
export function splitmix32(a: number, normalRange: boolean): () => number {
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
/**
 * @returns Hash value between 0 and 1
 */
export function sfc_hash(seed: number, x: number, y: number, z: number): number {
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

function weightIndex(weights: number[], value: number): number {
    value *= weights.reduce((total, weight) => total + weight, 0);
    for(let i = 0; i < weights.length; i++) {
        value -= weights[i];
        if(value <= 0) {
            return i;
        }
    }
    throw new Error('Invalid weights');
}

/**
 * @returns Weight index
 */
export function voronoi_noise2d(seed: number, x: number, y: number, weights: number[]): number {
    let points: { x: number, y: number, type: number }[] = [];
    for(let i = Math.floor(x) - 1; i < Math.ceil(x) + 1; i++) {
        for(let j = Math.floor(y) - 1; j < Math.ceil(y) + 1; j++) {
            points.push({
                x: i + sfc_hash(seed, i, j, 0) - 0.5,
                y: j + sfc_hash(seed, i, j, 1) - 0.5,
                type: weightIndex(weights, sfc_hash(seed, i, j, 2))
            });
        }
    }

    let closestDist = Infinity;
    let closestType = -1;

    for(const point of points) {
        const dist = Math.sqrt((point.x - x)**2 + (point.y - y)**2);
        if(dist < closestDist) {
            closestDist = dist;
            closestType = point.type;
        }
    }

    if(closestType == -1) {
        throw new Error('Voronoi noise error.');
    }

    return closestType;
}


