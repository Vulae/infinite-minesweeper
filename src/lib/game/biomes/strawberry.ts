import type { Renderer } from '../renderer/renderer';
import { TileBasicSingularMine } from '../tile';

export class TileBiomeStrawberry extends TileBasicSingularMine {
    private readonly _mineSearchPattern: [number, number][];

    public constructor(
        x: number,
        y: number,
        isMine: boolean,
        mineSearchPattern: [number, number][]
    ) {
        super(x, y, isMine);
        this._mineSearchPattern = mineSearchPattern;
    }

    public mineSearchPattern(): [number, number][] {
        return this._mineSearchPattern;
    }

    public getTileKey(
        _renderer: Renderer,
        covered: boolean
    ): keyof Renderer['TILESET']['textures'] {
        return covered ? 'tile_strawberry_covered' : 'tile_strawberry_uncovered';
    }

    public color(): number {
        return 0xf888c9;
    }

    public tileCoveredTexture(): keyof Renderer['TILESET']['textures'] {
        return 'tile_strawberry_covered';
    }
}
