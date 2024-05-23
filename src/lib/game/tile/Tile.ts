
import * as bt from "bintype";
import { CHUNK_SIZE } from "../Constants";
import type { World } from "../World";
import type { BlueberryTile } from "./Blueberry";
import type { ChocolateTile } from "./Chocolate";
import type { StrawberryTile } from "./Strawberry";
import type { StroopwafelTile } from "./Stroopwafel";
import type { VanillaTile } from "./Vanilla";
import type { WaffleTile } from "./Waffle";



export const TILE_NONE_NEARBY = Symbol('TILE_NO_NEARBY');
export type TILE_NONE_NEARBY= typeof TILE_NONE_NEARBY;



export abstract class Tile {
    public abstract readonly type: string;

    public readonly world: World;
    public readonly x: number;
    public readonly y: number;

    public constructor(world: World, x: number, y: number) {
        this.world = world;
        this.x = x;
        this.y = y;
    }

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
    private minesNearbyCache: number | TILE_NONE_NEARBY | null = null;
    /**
     * @returns Number of mines in search pattern
     */
    public minesNearby(useCache: boolean = false): number | TILE_NONE_NEARBY {
        if(this.minesNearbyCache !== null && useCache) {
            return this.minesNearbyCache;
        }
        let none: boolean = true;
        let count: number = 0;
        for(const offset of this.searchPattern) {
            count += this.world.getTile(this.x + offset.x, this.y + offset.y).numMines();
            if(count != 0) none = false;
        }
        this.minesNearbyCache = (count == 0 && none) ? TILE_NONE_NEARBY : count;
        return this.minesNearbyCache;
    }
    /**
     * @returns Number of flags in search pattern
     */
    public flagsNearby(): number | TILE_NONE_NEARBY {
        let none: boolean = true;
        let count: number = 0;
        for(const offset of this.searchPattern) {
            count += this.world.getTile(this.x + offset.x, this.y + offset.y).numFlags();
            if(count != 0) none = false;
        }
        return (count == 0 && none) ? TILE_NONE_NEARBY : count;
    }

    /**
     * Use flag action
     */
    public abstract flag(): void;
    /**
     * Use reveal action
     * @returns If tile was revealed
     */
    public abstract reveal(): boolean;

    /**
     * If player has died on this tile.
     */
    public isDeathTile(): boolean {
        const chunk = this.world.getGeneratedChunk(Math.floor(this.x / CHUNK_SIZE), Math.floor(this.y / CHUNK_SIZE));
        const chunkPosX = this.x - chunk.chunkX * CHUNK_SIZE;
        const chunkPosY = this.y - chunk.chunkY * CHUNK_SIZE;
        return chunk.deaths.some(death => death.x == chunkPosX && death.y == chunkPosY);
    }



    public abstract save(io: bt.BitIO): void;
    public static load(world: World, x: number, y: number, io: bt.BitIO): ValidTile {
        throw new Error('Tile.load needs to be implemented on derived class.');
    }
}



// TODO: Probably rename above to TileBase and rename below type to just Tile.
// TODO: Swap name around, eg: VanillaTile -> TileVanilla
export type ValidTile = VanillaTile | ChocolateTile | WaffleTile | StroopwafelTile | BlueberryTile | StrawberryTile;
// FIXME: This is dumb, why not `typeof ArrayElement<ValidTile>`
export type ValidTileConstructor = typeof VanillaTile | typeof ChocolateTile | typeof WaffleTile | typeof StroopwafelTile | typeof BlueberryTile | typeof StrawberryTile;


