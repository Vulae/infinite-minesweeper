
import type { BitIO } from "$lib/BitIO";
import { sfc_hash } from "$lib/RNG";
import type { World } from "../World";
import { SingleMineTile, SingleMineTileState } from "./SingleMine";



export class ChocolateTile extends SingleMineTile {
    public readonly type: 'chocolate' = 'chocolate';

    public constructor(world: World, x: number, y: number) {
        const isMine = sfc_hash(world.tileSeed, x, y, 0) > 0.625;
        super(world, x, y, isMine);
    }

    public save(io: BitIO): void {
        io.writeBits(2, this.state);
    }

    public static load(world: World, x: number, y: number, io: BitIO): ChocolateTile {
        const tile = new ChocolateTile(world, x, y);
        switch(io.readBits(2)) {
            case SingleMineTileState.Covered: break;
            case SingleMineTileState.Flagged: tile.flag(); break;
            case SingleMineTileState.Revealed: tile.reveal(); break;
        }
        return tile;
    }
}


