
import { perlin_noise2d, splitmix32, voronoi_noise2d } from "./RNG";
import { ChocolateTile, Stroopwafel, VanillaTile, WaffleTile, type Tile } from "./Tile";
import type { World } from "./World";



type Biome = {
    type: 'biome',
    weight: number;
    tile: typeof Tile
} | {
    type: 'collection',
    weight: number;
    scale: number;
    smoothness: number;
    biomes: Biome[];
}

const Biomes: Biome = {
    type: 'collection',
    weight: 1,
    scale: 24,
    smoothness: 0.8,
    biomes: [{
        type: 'collection',
        weight: 5,
        scale: 24,
        smoothness: 0.8,
        biomes: [{
            type: 'biome',
            weight: 3,
            tile: VanillaTile
        }, {
            type: 'biome',
            weight: 1,
            tile: ChocolateTile
        }]
    }, {
        type: 'collection',
        weight: 2,
        scale: 64,
        smoothness: 0,
        biomes: [{
            type: 'biome',
            weight: 1,
            tile: WaffleTile
        }, {
            type: 'biome',
            weight: 2,
            tile: Stroopwafel
        }]
    }]
};



function smoothNoisyVoronoi(seed: number, x: number, y: number, dist: number, weights: number[]): number {
    const random = splitmix32(seed, false);
    const dx = perlin_noise2d(random(), x, y) * dist;
    const dy = perlin_noise2d(random(), x, y) * dist;
    return voronoi_noise2d(random(), x + dx, y + dy, weights);
}

export function generateTile(world: World, x: number, y: number): Tile {
    const random = splitmix32(world.biomeSeed, false);

    let biome: Biome = Biomes;
    while(biome.type == 'collection') {
        const index = smoothNoisyVoronoi(
            random(),
            x / biome.scale, y / biome.scale,
            biome.smoothness,
            biome.biomes.map(b => b.weight)
        );
        biome = biome.biomes[index];
    }

    // @ts-ignore - TODO: How do I deal with this?
    return new biome.tile(world, x, y);
}


