import type { Renderer } from '../renderer/renderer';
import { TileBasicSingularMine } from '../tile';

export class TileBiomeStroopwafel extends TileBasicSingularMine {
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
                ? 'tile_stroopwafel_1_covered'
                : 'tile_stroopwafel_1_uncovered'
            : covered
              ? 'tile_stroopwafel_2_covered'
              : 'tile_stroopwafel_2_uncovered';
    }

    public color(): number {
        return this.isDark ? 0xeda840 : 0xbf7200;
    }

    public tileCoveredTexture(): keyof Renderer['TILESET']['textures'] {
        return this.isDark ? 'tile_stroopwafel_1_covered' : 'tile_stroopwafel_2_covered';
    }
}
