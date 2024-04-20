
import { voronoi_noise2d } from "./RNG";
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



export function generateTile(world: World, x: number, y: number): Tile {
    // TODO: voronoi with less straight edges, using perlin noise or something to offset the base xy coordinates.
    const biomeIndex = voronoi_noise2d(world.biomeSeed, x / 16, y / 16, BiomeWeights);
    const isChocolate = voronoi_noise2d(world.chocolateSeed, x / 24, y / 24, [ 2, 1 ]);

    const biome = Biomes[biomeIndex];

    const tileClass = isChocolate ? biome.hardClass : biome.easyClass;
    // @ts-ignore - TODO: How do I deal with this?
    return new tileClass(world, x, y);
}


