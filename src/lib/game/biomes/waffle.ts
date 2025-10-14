import { hashNormalized } from '$lib/random/noise';
import type { Renderer } from '../renderer/renderer';
import { TileBasicSingularMine } from '../tile';

export function waffleIsMine(
    seed: number,
    checkerSize: number,
    x: number,
    y: number
): { isMine: boolean; isDark: boolean } {
    const checkerX = Math.floor(x / checkerSize);
    const checkerY = Math.floor(y / checkerSize);
    const isDark = (checkerX + (checkerY % 2)) % 2 == 0;

    const checkerIndex = Math.abs(x % checkerSize) + Math.abs(y % checkerSize) * checkerSize;
    const hash = hashNormalized(seed, checkerX, checkerY);
    const checkerRngPos = Math.floor(hash * checkerSize * checkerSize);

    return {
        isDark,
        isMine: isDark ? checkerIndex == checkerRngPos : checkerIndex != checkerRngPos
    };
}

export class TileBiomeWaffle extends TileBasicSingularMine {
    private readonly isDark: boolean;

    public constructor(x: number, y: number, isMine: boolean, isDark: boolean) {
        super(x, y, isMine);
        this.isDark = isDark;
    }

    public getTileKey(
        _renderer: Renderer,
        covered: boolean
    ): keyof Renderer['TILESET']['textures'] {
        return this.isDark
            ? covered
                ? 'tile_waffle_1_covered'
                : 'tile_waffle_1_uncovered'
            : covered
              ? 'tile_waffle_2_covered'
              : 'tile_waffle_2_uncovered';
    }

    public color(): number {
        return this.isDark ? 0xf7d299 : 0xa07a40;
    }

    public tileCoveredTexture(): keyof Renderer['TILESET']['textures'] {
        return this.isDark ? 'tile_waffle_1_covered' : 'tile_waffle_2_covered';
    }
}
