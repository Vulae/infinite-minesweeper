
import type { BitIO } from "$lib/BitIO";
import { hashNormal } from "$lib/RNG";
import type { World } from "../World";
import { SingleMineTile } from "./SingleMine";
import type { ValidTile } from "./Tile";



export class VanillaTile extends SingleMineTile {
    public readonly type: 'vanilla' = 'vanilla';

    public constructor(world: World, x: number, y: number) {
        const isMine = hashNormal(world.tileSeed, x, y, 0) > 0.85;
        super(world, x, y, isMine);
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(new VanillaTile(world, x, y), io);
    }
}


