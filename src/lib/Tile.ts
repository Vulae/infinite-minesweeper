
import { tileset, tilesetNumberTexture } from "./Assets";
import type { BitIO } from "./BitIO";
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



    public abstract save(io: BitIO): void;
    public static load(world: World, x: number, y: number, io: BitIO): Tile {
        throw new Error('Tile.load needs to be implemented on derived class.');
    }
}



// abstract class MultiMineTile extends Tile {
//     protected readonly _numMines: number;
//     protected _revealed: boolean = false;
//     protected _numFlags: number = 0;
//     protected readonly _numFlagsMax: number = 1;

//     public constructor(world: World, x: number, y: number, mines: number, maxMines: number) {
//         super(world, x, y);
//         this._numMines = mines;
//         this._numFlagsMax = maxMines;
//     }

//     public numMines(): number { return this._numMines; }
//     public numFlags(): number { return this._numFlags; }

//     public readonly searchPattern: { x: number, y: number }[] = [
//         { x: -1, y: 0 },
//         { x: -1, y: 1 },
//         { x: 0, y: 1 },
//         { x: 1, y: 1 },
//         { x: 1, y: 0 },
//         { x: 1, y: -1 },
//         { x: 0, y: -1 },
//         { x: -1, y: -1 }
//     ];

//     public flag(): void {
//         if(this._revealed) return;
//         this._numFlags++;
//         if(this._numFlags > this._numFlagsMax) {
//             this._numFlags = 0;
//         }
//     }

//     public reveal(): void {
//         if(this._numFlags > 0) return;
//         this._revealed = true;
//     }
// }



enum SingleMineTileState {
    Covered,
    Flagged,
    Revealed
}

abstract class SingleMineTile extends Tile {
    protected readonly isMine: boolean;
    protected state: SingleMineTileState = SingleMineTileState.Covered;

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

    public reveal(): void {
        if(this.state == SingleMineTileState.Flagged) return;
        this.state = SingleMineTileState.Revealed;
    }
}



export class VanillaTile extends SingleMineTile {
    public constructor(world: World, x: number, y: number) {
        const isMine = sfc_hash(world.tileSeed, x, y, 0) > 0.875;
        super(world, x, y, isMine);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        switch(this.state) {
            case SingleMineTileState.Covered: {
                tileset.draw(ctx, 'vanilla_tile_covered', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Flagged: {
                tileset.draw(ctx, 'vanilla_tile_covered', 0, 0, 1, 1);
                tileset.draw(ctx, 'flag', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Revealed: {
                tileset.draw(ctx, 'vanilla_tile_revealed', 0, 0, 1, 1);
                if(this.isMine) {
                    tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
                } else {
                    tileset.draw(ctx, tilesetNumberTexture(this.minesNearby()), 0, 0, 1, 1);
                }
                break; }
        }
    }

    public save(io: BitIO): void {
        io.writeBits(2, this.state);
    }

    public static load(world: World, x: number, y: number, io: BitIO): Tile {
        const tile = new VanillaTile(world, x, y);
        switch(io.readBits(2)) {
            case SingleMineTileState.Covered: break;
            case SingleMineTileState.Flagged: tile.flag(); break;
            case SingleMineTileState.Revealed: tile.reveal(); break;
        }
        return tile;
    }
}

export class ChocolateTile extends SingleMineTile {
    public constructor(world: World, x: number, y: number) {
        const isMine = sfc_hash(world.tileSeed, x, y, 0) > 0.625;
        super(world, x, y, isMine);
    }

    public render(ctx: CanvasRenderingContext2D): void {
        switch(this.state) {
            case SingleMineTileState.Covered: {
                tileset.draw(ctx, 'chocolate_tile_covered', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Flagged: {
                tileset.draw(ctx, 'chocolate_tile_covered', 0, 0, 1, 1);
                tileset.draw(ctx, 'flag', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Revealed: {
                tileset.draw(ctx, 'chocolate_tile_revealed', 0, 0, 1, 1);
                if(this.isMine) {
                    tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
                } else {
                    tileset.draw(ctx, tilesetNumberTexture(this.minesNearby()), 0, 0, 1, 1);
                }
                break; }
        }
    }

    public save(io: BitIO): void {
        io.writeBits(2, this.state);
    }

    public static load(world: World, x: number, y: number, io: BitIO): Tile {
        const tile = new ChocolateTile(world, x, y);
        switch(io.readBits(2)) {
            case SingleMineTileState.Covered: break;
            case SingleMineTileState.Flagged: tile.flag(); break;
            case SingleMineTileState.Revealed: tile.reveal(); break;
        }
        return tile;
    }
}



function waffle(world: World, checkerSize: number, x: number, y: number): { isDark: boolean, isMine: boolean } {
    const checkerX = Math.floor(x / checkerSize);
    const checkerY = Math.floor(y / checkerSize);
    const isDark = (checkerX + checkerY % 2) % 2 == 0;

    const checkerIndex = Math.abs(x % checkerSize) + Math.abs(y % checkerSize) * checkerSize;
    const checkerRngPos = Math.floor(sfc_hash(world.tileSeed, checkerX, checkerY, 0) * checkerSize**2);
    
    const isMine = (isDark ? (
        checkerIndex == checkerRngPos ? false : true
    ) : (
        checkerIndex == checkerRngPos ? true : false
    ));

    return { isDark, isMine };
}

export class WaffleTile extends SingleMineTile {
    public readonly isDark: boolean;

    public constructor(world: World, x: number, y: number) {
        const { isDark, isMine } = waffle(world, 2, x, y);
        super(world, x, y, isMine);
        this.isDark = isDark
    }

    public render(ctx: CanvasRenderingContext2D): void {
        switch(this.state) {
            case SingleMineTileState.Covered: {
                tileset.draw(ctx, this.isDark ? 'waffle_tile_covered_dark' : 'waffle_tile_covered_light', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Flagged: {
                tileset.draw(ctx, this.isDark ? 'waffle_tile_covered_dark' : 'waffle_tile_covered_light', 0, 0, 1, 1);
                tileset.draw(ctx, 'flag', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Revealed: {
                tileset.draw(ctx, this.isDark ? 'waffle_tile_revealed_dark' : 'waffle_tile_revealed_light', 0, 0, 1, 1);
                if(this.isMine) {
                    tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
                } else {
                    tileset.draw(ctx, tilesetNumberTexture(this.minesNearby()), 0, 0, 1, 1);
                }
                break; }
        }
    }

    public save(io: BitIO): void {
        io.writeBits(2, this.state);
    }

    public static load(world: World, x: number, y: number, io: BitIO): Tile {
        const tile = new WaffleTile(world, x, y);
        switch(io.readBits(2)) {
            case SingleMineTileState.Covered: break;
            case SingleMineTileState.Flagged: tile.flag(); break;
            case SingleMineTileState.Revealed: tile.reveal(); break;
        }
        return tile;
    }
}

export class Stroopwafel extends SingleMineTile {
    public readonly isDark: boolean;

    public constructor(world: World, x: number, y: number) {
        const { isDark, isMine } = waffle(world, 3, x, y);
        super(world, x, y, isMine);
        this.isDark = isDark
    }

    public render(ctx: CanvasRenderingContext2D): void {
        switch(this.state) {
            case SingleMineTileState.Covered: {
                tileset.draw(ctx, this.isDark ? 'stroopwafel_tile_covered_dark' : 'stroopwafel_tile_covered_light', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Flagged: {
                tileset.draw(ctx, this.isDark ? 'stroopwafel_tile_covered_dark' : 'stroopwafel_tile_covered_light', 0, 0, 1, 1);
                tileset.draw(ctx, 'flag', 0, 0, 1, 1);
                break; }
            case SingleMineTileState.Revealed: {
                tileset.draw(ctx, this.isDark ? 'stroopwafel_tile_revealed_dark' : 'stroopwafel_tile_revealed_light', 0, 0, 1, 1);
                if(this.isMine) {
                    tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
                } else {
                    tileset.draw(ctx, tilesetNumberTexture(this.minesNearby()), 0, 0, 1, 1);
                }
                break; }
        }
    }

    public save(io: BitIO): void {
        io.writeBits(2, this.state);
    }

    public static load(world: World, x: number, y: number, io: BitIO): Tile {
        const tile = new Stroopwafel(world, x, y);
        switch(io.readBits(2)) {
            case SingleMineTileState.Covered: break;
            case SingleMineTileState.Flagged: tile.flag(); break;
            case SingleMineTileState.Revealed: tile.reveal(); break;
        }
        return tile;
    }
}
