
import type { BitIO } from "$lib/BitIO";
import { sfc_hash } from "$lib/RNG";
import type { World } from "../World";
import { SingleMineTile, SingleMineTileState } from "./SingleMine";
import type { ValidTile } from "./Tile";



export class ChocolateTile extends SingleMineTile {
    public readonly type: 'chocolate' = 'chocolate';

    public constructor(world: World, x: number, y: number) {
        const isMine = sfc_hash(world.tileSeed, x, y, 0) > 0.625;
        super(world, x, y, isMine);
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(this, world, x, y, io);
    }
}


