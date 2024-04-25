
import { perlin_noise2d, splitmix32, voronoi_noise2d } from "../RNG";
import type { World } from "./World";
import { ChocolateTile } from "./tile/Chocolate";
import { StroopwafelTile } from "./tile/Stroopwafel";
import type { Tile, ValidTile, ValidTileConstructor } from "./tile/Tile";
import { VanillaTile } from "./tile/Vanilla";
import { WaffleTile } from "./tile/Waffle";



type Biome = {
    type: 'biome',
    weight: number;
    tile: ValidTileConstructor;
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
            tile: StroopwafelTile
        }]
    }]
};



function smoothNoisyVoronoi(seed: number, x: number, y: number, dist: number, weights: number[]): number {
    const random = splitmix32(seed, false);
    const dx = perlin_noise2d(random(), x, y) * dist;
    const dy = perlin_noise2d(random(), x, y) * dist;
    return voronoi_noise2d(random(), x + dx, y + dy, weights);
}

export function getTileType(world: World, x: number, y: number): ValidTileConstructor {
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

    return biome.tile;
}

export function generateTile(world: World, x: number, y: number): ValidTile {
    const tileConstructor = getTileType(world, x, y);
    // @ts-ignore - TODO: How do I deal with this?
    return new tileConstructor(world, x, y);
}


