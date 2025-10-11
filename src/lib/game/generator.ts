import { hash, Splitmax32 } from '$lib/random/noise';
import { PerlinNoiseSampler } from '$lib/random/perlin';
import { mapRangeInt } from '$lib/util';
import { TileBiomeBlueberry } from './biomes/blueberry';
import { TileBiomeChocolate } from './biomes/chocolate';
import { TileBiomeCookiesAndCream, TileCookiesAndCreamMine } from './biomes/cookiesAndCream';
import { TileBiomeStrawberry } from './biomes/strawberry';
import { TileBiomeStroopwafel } from './biomes/stroopwafel';
import { TileBiomeVanilla } from './biomes/vanilla';
import { TileBiomeWaffle, waffleIsMine } from './biomes/waffle';
import { type Tile } from './tile';

type TileGenerator = (this: WorldGenerator, x: number, y: number, random: Splitmax32) => Tile;
type TileGenerators = { [key: string]: TileGenerator };

const WorldTileGenerators: TileGenerators = {
    vanilla: function (x, y, random) {
        return new TileBiomeVanilla(x, y, random.bool(0.2));
    },
    chocolate: function (x, y, random) {
        return new TileBiomeChocolate(x, y, random.bool(0.3));
    },
    strawberry: function (x, y, random) {
        if (random.float() < 0.25) {
            return new TileBiomeStrawberry(x, y, true, []);
        } else {
            const pattern: [number, number][] = [];
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (random.float() < 1 - dist / 3) {
                        pattern.push([dx, dy]);
                    }
                }
            }
            return new TileBiomeStrawberry(x, y, false, pattern);
        }
    },
    blueberry: function (x, y, random) {
        return new TileBiomeBlueberry(
            x,
            y,
            random.bool(0.25) ? mapRangeInt(random.float(), 0, 1, 1, 3) : 0
        );
    },
    waffle: function (x, y) {
        const { isDark, isMine } = waffleIsMine(this.seed, 2, x, y);
        return new TileBiomeWaffle(x, y, isMine, isDark);
    },
    stroopwafel: function (x, y) {
        const { isDark, isMine } = waffleIsMine(this.seed, 3, x, y);
        return new TileBiomeStroopwafel(x, y, isMine, isDark);
    },
    cookies_and_cream: function (x, y, random) {
        return new TileBiomeCookiesAndCream(
            x,
            y,
            random.bool(0.25)
                ? random.bool()
                    ? TileCookiesAndCreamMine.Mine
                    : TileCookiesAndCreamMine.AntiMine
                : TileCookiesAndCreamMine.None
        );
    }
} as const;

export class WorldGenerator {
    public readonly seed: number;
    private readonly biomeSeed: number;
    private readonly tileSeed: number;

    public constructor(seed: number) {
        if (!Number.isInteger(seed)) {
            throw new Error(`Invalid seed: ${seed}`);
        }
        this.seed = seed;
        const random = new Splitmax32(this.seed);
        this.biomeSeed = random.int();
        this.tileSeed = random.int();
    }

    private getBiome(x: number, y: number): keyof typeof WorldTileGenerators {
        const random = new Splitmax32(this.biomeSeed);

        const chocolatelyness = new PerlinNoiseSampler(random.int()).perlin2(x / 48, y / 48, 3);
        const berryness = new PerlinNoiseSampler(random.int()).perlin2(x / 64, y / 32, 2);
        const wafflyness = new PerlinNoiseSampler(random.int()).perlin2(x / 64, y / 64, 2);
        const weirdness = new PerlinNoiseSampler(random.int()).perlin2(x / 64, y / 64, 2);

        if (wafflyness > 0.6) {
            return chocolatelyness < 0.5 ? 'waffle' : 'stroopwafel';
        }
        if (berryness > 0.5) {
            return chocolatelyness < 0.5 ? 'strawberry' : 'blueberry';
        }
        if (weirdness > 0.6) {
            return 'cookies_and_cream';
        }

        return chocolatelyness < 0.5 ? 'vanilla' : 'chocolate';
    }

    public generateTile(x: number, y: number): Tile {
        const dist = Math.sqrt(x * x + y * y);
        if (dist < 16) {
            if (dist < 8) {
                return new TileBiomeVanilla(x, y, false);
            } else {
                return WorldTileGenerators['vanilla'].call(
                    this,
                    x,
                    y,
                    new Splitmax32(hash(this.tileSeed, x, y))
                );
            }
        }
        return WorldTileGenerators[this.getBiome(x, y)].call(
            this,
            x,
            y,
            new Splitmax32(hash(this.tileSeed, x, y))
        );
    }
}
