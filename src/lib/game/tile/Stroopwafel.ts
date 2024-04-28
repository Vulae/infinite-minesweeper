
import type { BitIO } from "$lib/BitIO";
import type { World } from "../World";
import { SingleMineTile } from "./SingleMine";
import type { ValidTile } from "./Tile";
import { waffle } from "./Waffle";



export class StroopwafelTile extends SingleMineTile {
    public readonly type: 'stroopwafel' = 'stroopwafel';

    public readonly isDark: boolean;

    public constructor(world: World, x: number, y: number) {
        const { isDark, isMine } = waffle(world, 3, x, y);
        super(world, x, y, isMine);
        this.isDark = isDark
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(new StroopwafelTile(world, x, y), io);
    }
}


