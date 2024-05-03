
import { Chunk, GeneratedChunk } from "./Chunk";
import { CHUNK_SIZE } from "./Constants";
import { generateTile } from "./Generator";
import { splitmix32 } from "../RNG";
import type { ValidTile } from "./tile/Tile";
import { EventDispatcher } from "$lib/EventDispatcher";
import * as b from "$lib/BinType";



// https://stackoverflow.com/questions/398299#answer-33639875
function* spiralIter(offsetX: number, offsetY: number): Generator<{ x: number, y: number }> {
    let x = offsetX;
    let y = offsetY;
    let d = 1;
    let m = 1;
    while(true) {
        while(2 * x * d < m) {
            yield { x, y };
            x += d;
        }
        while(2 * y * d < m) {
            yield { x, y };
            y += d;
        }
        d = -1 * d;
        m += 1;
    }
}



type ChunkCoordinate = `${number},${number}`;

export class World extends EventDispatcher<{
    'sound_reveal': number;
    'sound_unflag': null;
    'sound_explosion': null;
    'particle_unflag': { x: number, y: number };
    'particle_explosion': { x: number, y: number };
    'particle_reveal': { x: number, y: number };
    'die': { x: number, y: number };
}> {
    public readonly seed: number;
    public readonly tileSeed: number;
    public readonly biomeSeed: number;

    protected _createdAt: Date = new Date();
    public get createdAt(): Date { return this._createdAt; }

    protected _deaths: number = 0;
    public get deaths(): number { return this._deaths; }

    constructor(seed: number) {
        super();
        this.seed = (seed & 0xFFFFFFFF) >>> 0;
        const rng = splitmix32(this.seed, false);
        this.tileSeed = rng();
        this.biomeSeed = rng();
        this.addEventListener('die', () => this._deaths++);
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
        const prevNumFlags = tile.numFlags();
        tile.flag();
        const currentNumFlags = tile.numFlags();
        if(currentNumFlags == 0 && currentNumFlags != prevNumFlags) {
            this.dispatchEvent('particle_unflag', { x, y });
            this.dispatchEvent('sound_unflag', null);
        }
    }

    private _revealCount: number = 0;
    private _died: boolean = false;
    private _reveal(x: number, y: number): void {
        const tile = this.getTile(x, y);
        if(tile.reveal()) {
            this._revealCount++;
            if(tile.numMines() > 0) {
                this._died = true;
                this.dispatchEvent('particle_explosion', { x: tile.x, y: tile.y });
                this.dispatchEvent('die', { x: tile.x, y: tile.y });
                return;
            } else {
                this.dispatchEvent('particle_reveal', { x: tile.x, y: tile.y });
            }
        }

        let reveal: ValidTile[] = [ ];
        let stack: ValidTile[] = [ ];
        if(tile.minesNearby() == tile.flagsNearby()) {
            stack.push(tile);
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
                if(nTile.minesNearby() == 0) {
                    stack.push(nTile);
                } else {
                    reveal.push(nTile);
                }
            }
        }

        for(const r of reveal) {
            if(r.reveal()) {
                this._revealCount++;
                if(r.numMines() > 0) {
                    this._died = true;
                    this.dispatchEvent('particle_explosion', { x: r.x, y: r.y });
                    this.dispatchEvent('die', { x: tile.x, y: tile.y });
                } else {
                    this.dispatchEvent('particle_reveal', { x: r.x, y: r.y });
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
    }



    public closest0(offsetX: number, offsetY: number): { x: number, y: number } {
        for(const { x, y } of spiralIter(offsetX, offsetY)) {
            const tile = this.getTile(x, y);
            if(tile.numMines() == 0 && tile.minesNearby() == 0) {
                return { x, y };
            }
        }
        throw new Error('This error should never happen, it\'s just here to make TypeScript happy.');
    }



    public save(): ArrayBuffer {
        const saveObj: b.ParserType<typeof F_SAVE> = {
            seed: this.seed,
            createdAt: this.createdAt,
            numDeaths: this.deaths,
            chunks: { }
        };

        for(const _chunkCoord in this.chunks) {
            const chunkCoord = _chunkCoord as ChunkCoordinate;
            const chunk = this.chunks[chunkCoord];
            saveObj.chunks[chunkCoord] = {
                tiles: chunk.encodeTiles()
            };
        }

        return F_SAVE.toBinary(saveObj);
    }

    public static load(saveBinary: ArrayBuffer): World {
        const save = F_SAVE.fromBinary(saveBinary);

        const world = new World(save.seed);
        world._createdAt = save.createdAt;
        world._deaths = save.numDeaths;

        for(const _chunkCoord in save.chunks) {
            const chunkCoord = _chunkCoord as ChunkCoordinate;
            const [ _, chunkXstr, chunkYstr ] = chunkCoord.match(/^(-?\d+),(-?\d+)$/)!;
            const [ chunkX, chunkY ] = [ parseInt(chunkXstr), parseInt(chunkYstr) ];
            const chunk = save.chunks[chunkCoord];
            world.chunks[chunkCoord] = GeneratedChunk.decodeTiles(world, chunkX, chunkY, chunk.tiles);
        }

        return world;
    }

}



const F_SAVE = b.packed(b.object({
    seed: b.number('u32'),
    createdAt: b.date(),
    numDeaths: b.number('u32'),
    chunks: b.record(b.string(), b.object({
        tiles: b.binary()
    }))
}), true);


