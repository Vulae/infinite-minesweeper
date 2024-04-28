
import type { BitIO } from "$lib/BitIO";
import type { World } from "../World";
import type { BlueberryTile } from "./Blueberry";
import type { ChocolateTile } from "./Chocolate";
import type { StroopwafelTile } from "./Stroopwafel";
import type { VanillaTile } from "./Vanilla";
import type { WaffleTile } from "./Waffle";

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
    private minesNearbyCache: number | null = null;
    /**
     * @returns Number of mines in search pattern
     */
    public minesNearby(useCache: boolean = false): number {
        if(this.minesNearbyCache !== null && useCache) {
            return this.minesNearbyCache;
        }
        this.minesNearbyCache = 0;
        for(const offset of this.searchPattern) {
            this.minesNearbyCache += this.world.getTile(this.x + offset.x, this.y + offset.y).numMines();
        }
        return this.minesNearbyCache;
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
     * @returns If tile was revealed
     */
    public abstract reveal(): boolean;



    public abstract save(io: BitIO): void;
    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        throw new Error('Tile.load needs to be implemented on derived class.');
    }
}



// TODO: Probably rename above to TileBase and rename below type to just Tile.
// TODO: Swap name around, eg: VanillaTile -> TileVanilla
export type ValidTile = VanillaTile | ChocolateTile | WaffleTile | StroopwafelTile | BlueberryTile;
// FIXME: This is dumb, why not `typeof ArrayElement<ValidTile>`
export type ValidTileConstructor = typeof VanillaTile | typeof ChocolateTile | typeof WaffleTile | typeof StroopwafelTile | typeof BlueberryTile;


