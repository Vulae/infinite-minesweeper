
import type { BitIO } from "$lib/BitIO";
import { sfc_hash } from "$lib/RNG";
import type { World } from "../World";
import { SingleMineTile, SingleMineTileState } from "./SingleMine";
import type { ValidTile } from "./Tile";



export class VanillaTile extends SingleMineTile {
    public readonly type: 'vanilla' = 'vanilla';

    public constructor(world: World, x: number, y: number) {
        const isMine = sfc_hash(world.tileSeed, x, y, 0) > 0.875;
        super(world, x, y, isMine);
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(this, world, x, y, io);
    }
}


