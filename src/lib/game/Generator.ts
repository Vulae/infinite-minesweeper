
import { perlin_noise2d, splitmix32, voronoi_noise2d } from "../RNG";
import type { World } from "./World";
import { BlueberryTile } from "./tile/biome/Blueberry";
import { ChocolateTile } from "./tile/biome/Chocolate";
import { StrawberryTile } from "./tile/biome/Strawberry";
import { StroopwafelTile } from "./tile/biome/Stroopwafel";
import type { ValidTile, ValidTileConstructor } from "./tile/Tile";
import { VanillaTile } from "./tile/biome/Vanilla";
import { WaffleTile } from "./tile/biome/Waffle";
import { CookiesAndCreamTile } from "./tile/biome/CookiesAndCream";



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
    }, {
        type: 'collection',
        weight: 2,
        scale: 32,
        smoothness: 0.5,
        biomes: [{
            type: 'biome',
            weight: 1,
            tile: BlueberryTile
        }, {
            type: 'biome',
            weight: 1,
            tile: StrawberryTile
        }]
    }, {
        type: 'biome',
        weight: 2,
        tile: CookiesAndCreamTile
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
    return new tileConstructor(world, x, y);
}


