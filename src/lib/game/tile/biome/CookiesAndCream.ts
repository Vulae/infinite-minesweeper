
import * as bt from "bintype";
import { hashNormal } from "$lib/RNG";
import type { World } from "../../World";
import type { ValidTile } from "../Tile";
import { SingleAntiMineTile, SingleAntiMineTileMines } from "../SingleAntiMine";



export class CookiesAndCreamTile extends SingleAntiMineTile {
    public readonly type: 'cookies_and_cream' = 'cookies_and_cream';

    public constructor(world: World, x: number, y: number) {
        const isMine = hashNormal(world.tileSeed, x, y, 0) > 0.7;
        const isAnti = hashNormal(world.tileSeed, x, y, 1) > 0.5;
        super(world, x, y, isMine ? (isAnti ? SingleAntiMineTileMines.Anti : SingleAntiMineTileMines.Normal) : SingleAntiMineTileMines.None);
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        return this.loadInternal(new CookiesAndCreamTile(world, x, y), io);
    }
}


