import type { Renderer } from '../renderer/renderer';
import { TileBasicSingularMine } from '../tile';

export class TileBiomeChocolate extends TileBasicSingularMine {
    public constructor(x: number, y: number, isMine: boolean) {
        super(x, y, isMine);
    }

    public getTileKey(
        _renderer: Renderer,
        covered: boolean
    ): keyof Renderer['TILESET']['textures'] {
        return covered ? 'tile_chocolate_covered' : 'tile_chocolate_uncovered';
    }

    public color(): number {
        return 0x5b440a;
    }

    public tileCoveredTexture(): keyof Renderer['TILESET']['textures'] {
        return 'tile_chocolate_covered';
    }
}
