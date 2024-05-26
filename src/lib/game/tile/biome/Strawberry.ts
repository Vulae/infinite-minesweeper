
import { hashNormal } from "$lib/RNG";
import type { World } from "../../World";
import { SingleMineTile } from "../SingleMine";
import { TILE_NONE_NEARBY, type ValidTile } from "../Tile";
import * as bt from "bintype";



export class StrawberryTile extends SingleMineTile {
    public readonly type: 'strawberry' = 'strawberry';
    public readonly secondaryNearbyCountModifier: number | null = null;
    public readonly secondaryNearbyCountRightSide: boolean = false;

    public constructor(world: World, x: number, y: number) {
        const isMine = hashNormal(world.tileSeed, x, y, 0) > 0.825;
        super(world, x, y, isMine);
        if(hashNormal(world.tileSeed, x, y, 1) > 0.3) {
            this.secondaryNearbyCountModifier = hashNormal(world.tileSeed, x, y, 2) > 0.3 ? 1 : -1;
            this.secondaryNearbyCountRightSide = hashNormal(world.tileSeed, x, y, 3) > 0.5;
        }
    }

    public secondaryMinesNearby(useCache: boolean): number | null {
        // TODO: What to do with negative number of mines here?
        if(this.secondaryNearbyCountModifier == null) return null;
        const nearby = this.minesNearby(useCache);
        if(nearby == TILE_NONE_NEARBY || nearby < 1) return null;
        const nearby2 = nearby + this.secondaryNearbyCountModifier;
        if(nearby2 <= 0) return null;
        return nearby2;
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        return this.loadInternal(new StrawberryTile(world, x, y), io);
    }
}


