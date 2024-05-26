
import * as bt from "bintype";
import { hashNormal } from "$lib/RNG";
import type { World } from "../../World";
import { SingleMineTile } from "../SingleMine";
import type { ValidTile } from "../Tile";



export class ChocolateTile extends SingleMineTile {
    public readonly type: 'chocolate' = 'chocolate';

    public constructor(world: World, x: number, y: number) {
        const isMine = hashNormal(world.tileSeed, x, y, 0) > 0.625;
        super(world, x, y, isMine);
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        return this.loadInternal(new ChocolateTile(world, x, y), io);
    }
}


