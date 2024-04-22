
import { perlin_noise2d, splitmix32, voronoi_noise2d } from "./RNG";
import { ChocolateTile, VanillaTile, type Tile } from "./Tile";
import type { World } from "./World";



interface Biome {
    easyClass: typeof Tile;
    hardClass: typeof Tile;
    weight: number;
}

const Biomes: Biome[] = [
    {
        easyClass: VanillaTile,
        hardClass: ChocolateTile,
        weight: 1,
    }
];

const BiomeWeights = Biomes.map(biome => biome.weight);



function smoothNoisyVoronoi(seed: number, x: number, y: number, dist: number, weights: number[]): number {
    const random = splitmix32(seed, false);
    const dx = perlin_noise2d(random(), x, y) * dist;
    const dy = perlin_noise2d(random(), x, y) * dist;
    return voronoi_noise2d(random(), x + dx, y + dy, weights);
}

export function generateTile(world: World, x: number, y: number): Tile {
    const biomeIndex = smoothNoisyVoronoi(world.biomeSeed, x / 16, y / 16, 0.2, BiomeWeights);
    const isChocolate = smoothNoisyVoronoi(world.chocolateSeed, x / 24, y / 24, 0.5, [ 2, 1 ]);

    const biome = Biomes[biomeIndex];

    const tileClass = isChocolate ? biome.hardClass : biome.easyClass;
    // @ts-ignore - TODO: How do I deal with this?
    return new tileClass(world, x, y);
}


