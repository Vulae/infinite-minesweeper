
import { hashNormal } from "$lib/RNG";
import { getTileType } from "$lib/game/Generator";
import type { World } from "../../World";
import { SingleAntiMineTile } from "../SingleAntiMine";
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

    private secondaryMinesNearbyCache: number | TILE_NONE_NEARBY | null = null;
    public secondaryMinesNearby(useCache: boolean): number | TILE_NONE_NEARBY {
        if(this.secondaryMinesNearbyCache !== null && useCache) {
            return this.secondaryMinesNearbyCache;
        }

        if(this.secondaryNearbyCountModifier == null) {
            this.secondaryMinesNearbyCache = TILE_NONE_NEARBY;
            return TILE_NONE_NEARBY;
        }

        const nearby = this.minesNearby(useCache);
        if(nearby == TILE_NONE_NEARBY) {
            this.secondaryMinesNearbyCache = TILE_NONE_NEARBY;
            return TILE_NONE_NEARBY;
        }

        const nearby2 = nearby + this.secondaryNearbyCountModifier;

        let allow0 = false;
        for(const offset of this.searchPattern) {
            const tile = getTileType(this.world, this.x + offset.x, this.y + offset.y);
            if(tile.prototype instanceof SingleAntiMineTile) {
                allow0 = true;
                break;
            }
        }
        if(!allow0 && nearby2 == 0) {
            this.secondaryMinesNearbyCache = TILE_NONE_NEARBY;
            return TILE_NONE_NEARBY;
        }

        this.secondaryMinesNearbyCache = nearby2;
        return this.secondaryMinesNearbyCache;
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        return this.loadInternal(new StrawberryTile(world, x, y), io);
    }
}


