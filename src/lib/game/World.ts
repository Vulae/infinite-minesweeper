
import { Chunk, GeneratedChunk } from "./Chunk";
import { CHUNK_SIZE } from "./Constants";
import { generateTile } from "./Generator";
import { splitmix32 } from "../RNG";
import { TILE_NONE_NEARBY, type ValidTile } from "./tile/Tile";
import { EventDispatcher } from "$lib/EventDispatcher";
import { F_WORLD } from "./Save";
import * as bt from "bintype";
import { spiralIter } from "$lib/Util";
import { StrawberryTileSecondaryMines } from "./tile/biome/Strawberry";



export type ChunkCoordinate = `${number},${number}`;

export class World extends EventDispatcher<{
    'change': null;
    'tile_update': ValidTile;
    'sound_reveal': number;
    'sound_unflag': null;
    'sound_explosion': null;
    'particle_unflag': { x: number, y: number };
    'particle_explosion': { x: number, y: number };
    'particle_reveal': { x: number, y: number };
    'die': { x: number, y: number };
}> {
    public change(): void {
        this.dispatchEvent('change', null);
    }

    public readonly seed: number;
    public readonly tileSeed: number;
    public readonly biomeSeed: number;

    public createdAt: Date = new Date();
    public deaths: number = 0;

    constructor(seed: number) {
        super();
        this.seed = (seed & 0xFFFFFFFF) >>> 0;
        const rng = splitmix32(this.seed, false);
        this.tileSeed = rng();
        this.biomeSeed = rng();
        this.addEventListener('die', ({ data: { x, y } }) => {
            this.deaths++;
            
            const deathChunk = this.getGeneratedChunk(Math.floor(x / CHUNK_SIZE), Math.floor(y / CHUNK_SIZE));
            deathChunk.deaths.push({
                x: x - (deathChunk.chunkX * CHUNK_SIZE),
                y: y - (deathChunk.chunkY * CHUNK_SIZE),
                diedAt: new Date()
            });
        });
    }

    private chunks: {[key: ChunkCoordinate]: GeneratedChunk} = {};

    public generateTile(x: number, y: number): ValidTile {
        return generateTile(this, x, y);
    }

    public getChunk(chunkX: number, chunkY: number): Chunk {
        const loadedChunk = this.chunks[`${chunkX},${chunkY}`];
        if(loadedChunk) return loadedChunk;
        return new Chunk(this, chunkX, chunkY);
    }

    public getGeneratedChunk(chunkX: number, chunkY: number): GeneratedChunk {
        const chunk = this.getChunk(chunkX, chunkY);
        if(chunk.isGenerated()) return chunk;
        const genChunk = chunk.generate();
        this.chunks[`${chunkX},${chunkY}`] = genChunk;
        return genChunk;
    }

    public getTile(x: number, y: number): ValidTile {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const chunk = this.getGeneratedChunk(chunkX, chunkY);
        return chunk.getTileAbsolute(x, y);
    }



    public flag(x: number, y: number): void {
        const tile = this.getTile(x, y);
        if(tile.isDeathTile()) return;
        const prevNumFlags = tile.numFlags();
        tile.flag();
        const currentNumFlags = tile.numFlags();
        if(currentNumFlags == 0 && currentNumFlags != prevNumFlags) {
            this.dispatchEvent('particle_unflag', { x, y });
            this.dispatchEvent('sound_unflag', null);
        }
        // FIXME: This should not always execute.
        this.dispatchEvent('tile_update', tile);
    }

    private _revealCount: number = 0;
    private _died: boolean = false;
    private _reveal(x: number, y: number): void {
        const tile = this.getTile(x, y);
        if(tile.reveal()) {
            this._revealCount++;
            if(tile.numMines() != 0) {
                this._died = true;
                this.dispatchEvent('particle_explosion', { x: tile.x, y: tile.y });
                this.dispatchEvent('die', { x: tile.x, y: tile.y });
                this.dispatchEvent('tile_update', tile);
                return;
            } else {
                this.dispatchEvent('particle_reveal', { x: tile.x, y: tile.y });
                this.dispatchEvent('tile_update', tile);
            }
        }

        // TODO: Change these to sets.
        let reveal: ValidTile[] = [ ];
        let stack: ValidTile[] = [ ];
        // If either of strawberry nearby mine values is right.
        if(tile.type == 'strawberry' && tile.secondaryNearbyMines != StrawberryTileSecondaryMines.None) {
            const nearbySecondary = tile.secondaryMinesNearby(false);
            if(nearbySecondary !== null && nearbySecondary == tile.flagsNearby()) {
                stack.push(tile);
            }
        }
        if(tile.minesNearby() == tile.flagsNearby()) {
            if(!stack.includes(tile)) stack.push(tile);
        }

        while(stack.length > 0) {
            const tile = stack.pop()!;
            reveal.push(tile);

            for(const offset of tile.searchPattern) {
                const nTile = this.getTile(tile.x + offset.x, tile.y + offset.y);
                if(
                    stack.some(t => t.x == nTile.x && t.y == nTile.y) ||
                    reveal.some(t => t.x == nTile.x && t.y == nTile.y)
                ) continue;
                if(nTile.minesNearby() == TILE_NONE_NEARBY) {
                    stack.push(nTile);
                } else {
                    reveal.push(nTile);
                }
            }
        }

        for(const r of reveal) {
            if(r.reveal()) {
                this._revealCount++;
                if(r.numMines() != 0) {
                    this._died = true;
                    this.dispatchEvent('particle_explosion', { x: r.x, y: r.y });
                    this.dispatchEvent('die', { x: r.x, y: r.y });
                    this.dispatchEvent('tile_update', r);
                } else {
                    this.dispatchEvent('particle_reveal', { x: r.x, y: r.y });
                    this.dispatchEvent('tile_update', r);
                }
            }
        }
    }

    /**
     * @returns If death
     */
    public reveal(x: number, y: number): boolean {
        this._revealCount = 0;
        this._died = false;
        this._reveal(x, y);
        if(this._revealCount > 0) {
            this.dispatchEvent('sound_reveal', this._revealCount);
        }
        if(this._died) {
            this.dispatchEvent('sound_explosion', null);
        }
        return this._died;
    }

    public reset(x: number, y: number): void {
        const chunk = this.getChunk(Math.floor(x / CHUNK_SIZE), Math.floor(y / CHUNK_SIZE));
        if(!chunk.isGenerated()) return;
        chunk.resetTileAbsolute(x, y);
        this.dispatchEvent('tile_update', this.getTile(x, y));
    }



    public closest0(offsetX: number, offsetY: number): { x: number, y: number } {
        for(const { x, y } of spiralIter(offsetX, offsetY)) {
            const tile = this.getTile(x, y);
            if(tile.numMines() == 0 && tile.minesNearby() == TILE_NONE_NEARBY) {
                return { x, y };
            }
        }
        throw new Error('This error should never happen, it\'s just here to make TypeScript happy.');
    }



    public save(): bt.ParserType<typeof F_WORLD> {
        const obj: bt.ParserType<typeof F_WORLD> = {
            seed: this.seed,
            createdAt: this.createdAt,
            numDeaths: this.deaths,
            chunks: new Map()
        };

        for(const _chunkCoord in this.chunks) {
            const chunkCoord = _chunkCoord as ChunkCoordinate;
            const chunk = this.chunks[chunkCoord];
            obj.chunks.set(chunkCoord, chunk.save());
        }

        return obj;
    }

    public static load(save: bt.ParserType<typeof F_WORLD>): World {
        const world = new World(save.seed);
        world.createdAt = save.createdAt;
        world.deaths = save.numDeaths;

        save.chunks.forEach((chunk, coord) => {
            const [ _, chunkXstr, chunkYstr ] = coord.match(/^(-?\d+),(-?\d+)$/)!;
            const [ chunkX, chunkY ] = [ parseInt(chunkXstr), parseInt(chunkYstr) ];
            world.chunks[coord] = GeneratedChunk.load(world, chunkX, chunkY, chunk);
        });

        return world;
    }

}


