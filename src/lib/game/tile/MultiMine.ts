
import { bitsToRepresentValue, type BitIO } from "$lib/BitIO";
import type { World } from "../World";
import { Tile, type ValidTile } from "./Tile";

export abstract class MultiMineTile extends Tile {
    public readonly _numMines: number;
    public abstract readonly numMaxMines: number;
    public _numFlags: number = 0;
    public isRevealed: boolean = false;

    public constructor(world: World, x: number, y: number, numMines: number) {
        super(world, x, y);
        this._numMines = numMines;
    }

    public numMines(): number { return this._numMines; }
    public numFlags(): number { return this._numFlags; }

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
        if(this.isRevealed) return;
        this._numFlags++;
        this._numFlags %= (this.numMaxMines + 1);
    }

    public reveal(): boolean {
        if(this.isRevealed) return false;
        if(this._numFlags > 0) return false;
        if(this._numMines == 0) {
            this.isRevealed = true;
        } else {
            this._numFlags = this._numMines;
        }
        return true;
    }

    

    public save(io: BitIO): void {
        io.writeBit(this.isRevealed);
        if(!this.isRevealed) {
            io.writeBits(bitsToRepresentValue(this.numMaxMines), this._numFlags);
        }
    }

    protected static loadInternal<T extends MultiMineTile>(tile: T, io: BitIO): T {
        tile.isRevealed = io.readBit();
        if(!tile.isRevealed) {
            tile._numFlags = io.readBits(bitsToRepresentValue(tile.numMaxMines));
        }
        return tile;
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        throw new Error('MultiMineTile.load needs to be implemented on derived class.');
    }
}


