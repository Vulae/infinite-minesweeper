
import type { BitIO } from "$lib/BitIO";
import type { World } from "../World";
import { Tile, type ValidTile, type ValidTileConstructor } from "./Tile";

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
            this.flag();
        }
        return true;
    }

    

    public save(io: BitIO): void {
        if(this.isMine) {
            io.writeBit(this.state == SingleMineTileState.Flagged);
        } else {
            io.writeBits(2, this.state);
        }
    }

    protected static loadInternal<C extends ValidTileConstructor>(constructor: C, world: World, x: number, y: number, io: BitIO): ValidTile {
        const tile = new constructor(world, x, y);
        if(tile.isMine) {
            if(io.readBit()) tile.flag();
        } else {
            switch(io.readBits(2)) {
                case SingleMineTileState.Covered: break;
                case SingleMineTileState.Flagged: tile.flag(); break;
                case SingleMineTileState.Revealed: tile.reveal(); break;
            }
        }
        return tile;
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        throw new Error('SingleMineTile.load needs to be implemented on derived class.');
    }
}


