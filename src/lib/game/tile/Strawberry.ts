
import type { BitIO } from "$lib/BitIO";
import { hashNormal } from "$lib/RNG";
import type { World } from "../World";
import { SingleMineTile } from "./SingleMine";
import type { ValidTile } from "./Tile";



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

    public minesNearbySecondary(useCache: boolean = false): number | null {
        if(this.secondaryNearbyCountModifier == null) return null;
        const nearby = this.minesNearby(useCache);
        if(nearby <= 0) return null;
        const nearbySecondary = nearby + this.secondaryNearbyCountModifier;
        if(nearbySecondary <= 0) return null;
        return nearbySecondary;
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(new StrawberryTile(world, x, y), io);
    }
}


