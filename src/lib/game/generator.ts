import { mapRangeInt } from '$lib/util';
import { hash, perlin_noise2d, Splitmax32, voronoi_noise2d } from '../random';
import { TileBiomeBlueberry } from './biomes/blueberry';
import { TileBiomeChocolate } from './biomes/chocolate';
import { TileBiomeStrawberry } from './biomes/strawberry';
import { TileBiomeVanilla } from './biomes/vanilla';
import { type Tile } from './tile';

function smoothNoisyVoronoi(
    seed: number,
    x: number,
    y: number,
    dist: number,
    weights: number[]
): number {
    const random = new Splitmax32(seed);
    const dx = perlin_noise2d(random.int(), x, y) * dist;
    const dy = perlin_noise2d(random.int(), x, y) * dist;
    return voronoi_noise2d(random.int(), x + dx, y + dy, weights);
}

export function generateTile(seed: number, x: number, y: number): Tile {
    // Giant circle in middle of map that is vanilla biome
    const dist = Math.sqrt(x * x + y * y);
    if (dist < 16) {
        if (dist < 8) {
            return new TileBiomeVanilla(x, y, false);
        } else {
            const random = new Splitmax32(hash(seed, x, y));
            return new TileBiomeVanilla(x, y, random.float() < 0.2);
        }
    }

    const randomSeed = new Splitmax32(seed);
    const randomPos = new Splitmax32(hash(randomSeed.int(), x, y));

    switch (smoothNoisyVoronoi(randomSeed.int(), x / 64, y / 64, 8, [1, 1, 1, 1])) {
        case 0:
            return new TileBiomeVanilla(x, y, randomPos.float() < 0.2);
        case 1:
            return new TileBiomeChocolate(x, y, randomPos.float() < 0.3);
        case 2:
            return new TileBiomeBlueberry(
                x,
                y,
                randomPos.float() > 0.8 ? mapRangeInt(randomPos.float(), 0, 1, 1, 3) : 0
            );
        case 3: {
            const pattern: [number, number][] = [];
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (randomPos.float() < 1 - dist / 3) {
                        pattern.push([dx, dy]);
                    }
                }
            }
            return new TileBiomeStrawberry(x, y, randomPos.float() < 0.25, pattern);
        }
        default:
            throw new Error('Invalid biome');
    }
}
