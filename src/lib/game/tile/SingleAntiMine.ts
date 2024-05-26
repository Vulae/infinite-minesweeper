
import * as bt from "bintype";
import type { World } from "../World";
import { Tile, type ValidTile } from "./Tile";

export enum SingleAntiMineTileMines {
    None,
    Normal,
    Anti
}

export enum SingleAntiMineTileState {
    Covered,
    Flagged,
    AntiFlagged,
    Revealed
}

export abstract class SingleAntiMineTile extends Tile {
    public readonly mine: SingleAntiMineTileMines;
    public state: SingleAntiMineTileState = SingleAntiMineTileState.Covered;

    public constructor(world: World, x: number, y: number, mine: SingleAntiMineTileMines) {
        super(world, x, y);
        this.mine = mine;
    }

    public numMines(): number {
        return (this.mine == SingleAntiMineTileMines.Normal) ? 1 :
               (this.mine == SingleAntiMineTileMines.Anti) ? -1 :
               0;
    }
    public numFlags(): number {
        return (this.state == SingleAntiMineTileState.Flagged) ? 1 :
               (this.state == SingleAntiMineTileState.AntiFlagged) ? -1 :
               0;
    }

    public readonly searchPattern: { x: number, y: number }[] = [
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: -1 },
        { x: -1, y: -1 }
    ];

    public flag(): void {
        switch(this.state) {
            case SingleAntiMineTileState.Covered: this.state = SingleAntiMineTileState.Flagged; break;
            case SingleAntiMineTileState.Flagged: this.state = SingleAntiMineTileState.AntiFlagged; break;
            case SingleAntiMineTileState.AntiFlagged: this.state = SingleAntiMineTileState.Covered; break;
        }
    }

    public reveal(): boolean {
        if(this.state != SingleAntiMineTileState.Covered) return false;
        if(this.mine == SingleAntiMineTileMines.None) {
            this.state = SingleAntiMineTileState.Revealed;
        } else {
            this.state = (this.mine == SingleAntiMineTileMines.Normal) ? SingleAntiMineTileState.Flagged : SingleAntiMineTileState.AntiFlagged;
        }
        return true;
    }

    

    public save(io: bt.BitIO): void {
        if(this.mine == SingleAntiMineTileMines.Normal || this.mine == SingleAntiMineTileMines.Anti) {
            if(this.state == SingleAntiMineTileState.Covered) {
                io.putBit(false);
            } else {
                io.putBit(true);
                io.putBit(this.state == SingleAntiMineTileState.AntiFlagged ? true : false);
            }
        } else {
            if(this.state == SingleAntiMineTileState.Covered) {
                io.putBit(false);
            } else {
                io.putBit(true);
                if(this.state == SingleAntiMineTileState.Revealed) {
                    io.putBit(false);
                } else {
                    io.putBit(true);
                    io.putBit(this.state == SingleAntiMineTileState.AntiFlagged ? true : false);
                }
            }
        }
    }

    protected static loadInternal<T extends SingleAntiMineTile>(tile: T, io: bt.BitIO): T {
        if(tile.mine == SingleAntiMineTileMines.Normal || tile.mine == SingleAntiMineTileMines.Anti) {
            if(!io.getBit()) {
                tile.state = SingleAntiMineTileState.Covered;
            } else {
                tile.state = io.getBit() ? SingleAntiMineTileState.AntiFlagged : SingleAntiMineTileState.Flagged;
            }
        } else {
            if(!io.getBit()) {
                tile.state = SingleAntiMineTileState.Covered;
            } else {
                if(!io.getBit()) {
                    tile.state = SingleAntiMineTileState.Revealed;
                } else {
                    tile.state = io.getBit() ? SingleAntiMineTileState.AntiFlagged : SingleAntiMineTileState.Flagged;
                }
            }
        }
        return tile;
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        throw new Error('SingleAntiMineTile.load needs to be implemented on derived class.');
    }
}


