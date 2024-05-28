
import { hashNormal } from "$lib/RNG";
import { getTileType } from "$lib/game/Generator";
import type { World } from "../../World";
import { SingleAntiMineTile } from "../SingleAntiMine";
import { SingleMineTile } from "../SingleMine";
import { TILE_NONE_NEARBY, type ValidTile } from "../Tile";
import * as bt from "bintype";



export enum StrawberryTileSecondaryMines {
    None,
    Left,
    Right
}



export class StrawberryTile extends SingleMineTile {
    public readonly type: 'strawberry' = 'strawberry';

    public readonly secondaryNearbyMines: StrawberryTileSecondaryMines;
    public readonly secondaryNearbyMinesModifier: number;

    public constructor(world: World, x: number, y: number) {
        const isMine = hashNormal(world.tileSeed, x, y, 0) > 0.825;
        super(world, x, y, isMine);

        this.secondaryNearbyMines = hashNormal(world.tileSeed, x, y, 1) > 0.3 ? (
                hashNormal(world.tileSeed, x, y, 2) > 0.5 ?
                StrawberryTileSecondaryMines.Left :
                StrawberryTileSecondaryMines.Right
            ) : StrawberryTileSecondaryMines.None;
        this.secondaryNearbyMinesModifier = hashNormal(world.tileSeed, x, y, 3) > 0.3 ? 1 : -1;
    }

    private secondaryNearbyMiensCacheSet: boolean = false;
    private secondaryNearbyMinesCache: number | TILE_NONE_NEARBY | null = null;
    public secondaryMinesNearby(useCache: boolean): number | TILE_NONE_NEARBY | null {
        if(this.secondaryNearbyMiensCacheSet) {
            return this.secondaryNearbyMinesCache;
        }

        if(this.secondaryNearbyMines == StrawberryTileSecondaryMines.None) {
            this.secondaryNearbyMiensCacheSet = true;
            this.secondaryNearbyMinesCache = null;
            return this.secondaryNearbyMinesCache;
        }

        const nearby = this.minesNearby(useCache);
        if(nearby == TILE_NONE_NEARBY) {
            this.secondaryNearbyMiensCacheSet = true;
            this.secondaryNearbyMinesCache = TILE_NONE_NEARBY;
            return this.secondaryNearbyMinesCache;
        }

        const secondaryNearby = nearby + this.secondaryNearbyMinesModifier;

        let secondaryNearbyMinesAllowAnti: boolean = false;
        for(const offset of this.searchPattern) {
            const tile = getTileType(this.world, this.x + offset.x, this.y + offset.y);
            if(tile.prototype instanceof SingleAntiMineTile) {
                secondaryNearbyMinesAllowAnti = true;
                break;
            }
        }

        if(!secondaryNearbyMinesAllowAnti && secondaryNearby <= 0) {
            this.secondaryNearbyMiensCacheSet = true;
            this.secondaryNearbyMinesCache = null;
            return this.secondaryNearbyMinesCache;
        } else {
            this.secondaryNearbyMiensCacheSet = true;
            this.secondaryNearbyMinesCache = secondaryNearby;
            return this.secondaryNearbyMinesCache;
        }
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        return this.loadInternal(new StrawberryTile(world, x, y), io);
    }
}


