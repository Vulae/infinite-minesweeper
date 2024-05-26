
import * as bt from "bintype";
import { hashNormal } from "$lib/RNG";
import { mapRangeInt } from "$lib/Util";
import type { World } from "../../World";
import { MultiMineTile } from "../MultiMine";
import type { ValidTile } from "../Tile";



export class BlueberryTile extends MultiMineTile {
    public readonly type: 'blueberry' = 'blueberry';

    public readonly numMaxMines: number = 3;

    public constructor(world: World, x: number, y: number) {
        const numMines = hashNormal(world.tileSeed, x, y, 0) > 0.80 ?
            mapRangeInt(hashNormal(world.tileSeed, x, y, 1), 0, 1, 1, 3)
            : 0;
        super(world, x, y, numMines);
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        return this.loadInternal(new BlueberryTile(world, x, y), io);
    }
}


