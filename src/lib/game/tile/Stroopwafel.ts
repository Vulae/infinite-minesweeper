
import type { BitIO } from "$lib/BitIO";
import type { World } from "../World";
import { SingleMineTile, SingleMineTileState } from "./SingleMine";
import { waffle } from "./Waffle";



export class StroopwafelTile extends SingleMineTile {
    public readonly type: 'stroopwafel' = 'stroopwafel';

    public readonly isDark: boolean;

    public constructor(world: World, x: number, y: number) {
        const { isDark, isMine } = waffle(world, 3, x, y);
        super(world, x, y, isMine);
        this.isDark = isDark
    }

    public save(io: BitIO): void {
        io.writeBits(2, this.state);
    }

    public static load(world: World, x: number, y: number, io: BitIO): StroopwafelTile {
        const tile = new StroopwafelTile(world, x, y);
        switch(io.readBits(2)) {
            case SingleMineTileState.Covered: break;
            case SingleMineTileState.Flagged: tile.flag(); break;
            case SingleMineTileState.Revealed: tile.reveal(); break;
        }
        return tile;
    }
}


