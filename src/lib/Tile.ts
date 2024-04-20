
import { tileset, tilesetNumberTexture } from "./Assets";
import { sfc_hash } from "./RNG";
import type { World } from "./World";



export abstract class Tile {
    public readonly world: World;
    public readonly x: number;
    public readonly y: number;

    public constructor(world: World, x: number, y: number) {
        this.world = world;
        this.x = x;
        this.y = y;
    }

    /**
     * 
     * @param ctx - Transformed to tile coordinates
     */
    public abstract render(ctx: CanvasRenderingContext2D): void;

    /**
     * @returns Number of mines this tile has
     */
    public abstract numMines(): number;
    /**
     * @returns Number of flags this tile has
     */
    public abstract numFlags(): number;

    /**
     * Mines search pattern
     */
    public abstract readonly searchPattern: { x: number, y: number }[];
    /**
     * @returns Number of mines in search pattern
     */
    public minesNearby(): number {
        // TODO: Cache return value.
        let count: number = 0;
        for(const offset of this.searchPattern) {
            count += this.world.getTile(this.x + offset.x, this.y + offset.y).numMines();
        }
        return count;
    }
    /**
     * @returns Number of flags in search pattern
     */
    public flagsNearby(): number {
        // TODO: Cache return value.
        let count: number = 0;
        for(const offset of this.searchPattern) {
            count += this.world.getTile(this.x + offset.x, this.y + offset.y).numFlags();
        }
        return count;
    }

    /**
     * Use flag action
     */
    public abstract flag(): void;
    /**
     * Use reveal action
     */
    public abstract reveal(): void;
}



export class VanillaTile extends Tile {
    protected readonly _numMines: number;
    protected _revealed: boolean = false;
    protected _numFlags: number = 0;
    protected readonly _numFlagsMax: number = 1;

    public constructor(world: World, x: number, y: number) {
        super(world, x, y);
        this._numMines = (sfc_hash(this.world.tileSeed, this.x, this.y, 0) > 0.875) ? 1 : 0;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if(this._revealed) {
            tileset.draw(ctx, 'vanilla_tile_revealed', 0, 0, 1, 1);
            if(this._numMines > 0) {
                tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
            } else {
                tileset.draw(ctx, tilesetNumberTexture(this.minesNearby()), 0, 0, 1, 1);
            }
        } else {
            tileset.draw(ctx, 'vanilla_tile_covered', 0, 0, 1, 1);
            if(this._numFlags > 0) {
                tileset.draw(ctx, 'flag', 0, 0, 1, 1);
            }
        }
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
        if(this._revealed) return;
        this._numFlags++;
        if(this._numFlags > this._numFlagsMax) {
            this._numFlags = 0;
        }
    }

    public reveal(): void {
        if(this._numFlags > 0) return;
        this._revealed = true;
    }
}

export class ChocolateTile extends VanillaTile {
    protected readonly _numMines: number;
    
    public constructor(world: World, x: number, y: number) {
        super(world, x, y);
        this._numMines = (sfc_hash(this.world.tileSeed, this.x, this.y, 0) > 0.6) ? 1 : 0;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if(this._revealed) {
            tileset.draw(ctx, 'chocolate_tile_revealed', 0, 0, 1, 1);
            if(this._numMines > 0) {
                tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
            } else {
                tileset.draw(ctx, tilesetNumberTexture(this.minesNearby()), 0, 0, 1, 1);
            }
        } else {
            tileset.draw(ctx, 'chocolate_tile_covered', 0, 0, 1, 1);
            if(this._numFlags > 0) {
                tileset.draw(ctx, 'flag', 0, 0, 1, 1);
            }
        }
    }
}
