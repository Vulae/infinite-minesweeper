
import * as bt from "bintype";
import type { World } from "../World";
import { Tile, type ValidTile } from "./Tile";

export enum SingleMineTileState {
    Covered,
    Flagged,
    Revealed
}

export abstract class SingleMineTile extends Tile {
    public readonly isMine: boolean;
    public state: SingleMineTileState = SingleMineTileState.Covered;

    public constructor(world: World, x: number, y: number, isMine: boolean) {
        super(world, x, y);
        this.isMine = isMine;
    }

    public numMines(): number { return this.isMine ? 1 : 0; }
    public numFlags(): number { return (this.state == SingleMineTileState.Flagged) ? 1 : 0; }

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
        if(this.state == SingleMineTileState.Revealed) return;
        if(this.state == SingleMineTileState.Covered) {
            this.state = SingleMineTileState.Flagged;
        } else {
            this.state = SingleMineTileState.Covered;
        }
    }

    public reveal(): boolean {
        if(this.state != SingleMineTileState.Covered) return false;
        if(!this.isMine) {
            this.state = SingleMineTileState.Revealed;
        } else {
            this.state = SingleMineTileState.Flagged;
        }
        return true;
    }

    

    public save(io: bt.BitIO): void {
        if(this.isMine) {
            io.putBit(this.state == SingleMineTileState.Flagged);
        } else {
            io.putBits(this.state, 2);
        }
    }

    protected static loadInternal<T extends SingleMineTile>(tile: T, io: bt.BitIO): T {
        if(tile.isMine) {
            tile.state = io.getBit() ? SingleMineTileState.Flagged : SingleMineTileState.Covered;
        } else {
            tile.state = io.getBits(2);
        }
        return tile;
    }

    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        throw new Error('SingleMineTile.load needs to be implemented on derived class.');
    }
}


