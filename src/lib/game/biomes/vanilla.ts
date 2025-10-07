import type { Renderer } from '../renderer';
import { TileBasicSingularMine } from '../tile';

export class TileBiomeVanilla extends TileBasicSingularMine {
    public constructor(x: number, y: number, isMine: boolean) {
        super(x, y, isMine);
    }

    public getTileKey(
        _renderer: Renderer,
        covered: boolean
    ): keyof Renderer['TILESET']['textures'] {
        return covered ? 'tile_vanilla_covered' : 'tile_vanilla_uncovered';
    }

    public color(): number {
        return 0x808080;
    }
}
