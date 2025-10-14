import { EventDispatcher } from '$lib/eventDispatcher';
import { BitReader, BitWriter, DataReader, type DataWriter } from '$lib/io';
import { TileBiomeCookiesAndCream } from './biomes/cookiesAndCream';
import { WORLD_GENERATION_CHUNK_SIZE } from './consts';
import { WorldGenerator } from './generator';
import type { Tile } from './tile';

export const NEARBY_NONE: symbol = Symbol('NEARBY_NONE');

const CHUNK_SIZE: number = WORLD_GENERATION_CHUNK_SIZE;

class Chunk {
    public readonly chunkX: number;
    public readonly chunkY: number;

    private constructor(chunkX: number, chunkY: number) {
        this.chunkX = chunkX;
        this.chunkY = chunkY;
    }

    private readonly tiles: Tile[] = [];

    public getTile(x: number, y: number): Tile {
        return this.tiles[y * CHUNK_SIZE + x];
    }

    public static generate(chunkX: number, chunkY: number, generator: WorldGenerator): Chunk {
        if (!Number.isInteger(chunkX) || !Number.isInteger(chunkY)) {
            throw new Error(`Invalid chunk pos: ${chunkX}, ${chunkY}`);
        }
        const chunk = new Chunk(chunkX, chunkY);
        for (let dy = 0; dy < CHUNK_SIZE; dy++) {
            for (let dx = 0; dx < CHUNK_SIZE; dx++) {
                const x = chunkX * CHUNK_SIZE + dx;
                const y = chunkY * CHUNK_SIZE + dy;
                chunk.tiles[dy * CHUNK_SIZE + dx] = generator.generateTile(x, y);
            }
        }
        // console.info('Generated chunk', chunkX, chunkY, chunk);
        return chunk;
    }

    public save(writer: DataWriter): void {
        writer.write_int(this.chunkX);
        writer.write_int(this.chunkY);

        const bitWriter = new BitWriter();
        this.tiles.forEach((tile) => {
            tile.save(bitWriter);
        });
        const data = bitWriter.final();

        writer.write_int(data.byteLength);
        writer.write(new Uint8Array(data));
    }

    public static load(reader: DataReader, generator: WorldGenerator): Chunk {
        const chunkX = reader.read_int();
        const chunkY = reader.read_int();

        const chunk = Chunk.generate(chunkX, chunkY, generator);

        const data = reader.read(reader.read_int());
        const bitReader = new BitReader(data.buffer as ArrayBuffer);

        chunk.tiles.forEach((tile) => {
            tile.load(bitReader);
        });

        return chunk;
    }
}

type ChunkPos = `${number},${number}`;

type TilePos = `${number},${number}`;

export class World extends EventDispatcher<{
    change: { x: number; y: number };
    death: { tile: Tile };
    reveal: { tile: Tile };
    flag: { tile: Tile; previousFlagCount: number };
}> {
    public readonly generator: WorldGenerator;

    private readonly chunks: Map<ChunkPos, Chunk>;

    private constructor(
        deaths: Set<ChunkPos> = new Set(),
        generator: WorldGenerator = new WorldGenerator(Math.floor(Math.random() * 4294967296)),
        chunks: Map<ChunkPos, Chunk> = new Map()
    ) {
        super();
        this.deaths = deaths;
        this.generator = generator;
        this.chunks = chunks;
    }

    public static new(): World {
        return new World();
    }

    private getChunk(chunkX: number, chunkY: number): Chunk {
        const key: ChunkPos = `${chunkX},${chunkY}`;
        let chunk = this.chunks.get(key);
        if (!chunk) {
            chunk = Chunk.generate(chunkX, chunkY, this.generator);
            this.chunks.set(key, chunk);
        }
        return chunk;
    }

    public getTile(x: number, y: number): Tile {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const tileX = x - chunkX * CHUNK_SIZE;
        const tileY = y - chunkY * CHUNK_SIZE;
        const chunk = this.getChunk(chunkX, chunkY);
        return chunk.getTile(tileX, tileY);
    }

    public getTileDoNotGenerate(x: number, y: number): Tile | null {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const tileX = x - chunkX * CHUNK_SIZE;
        const tileY = y - chunkY * CHUNK_SIZE;
        const chunk = this.chunks.get(`${chunkX},${chunkY}`);
        if (chunk == null) {
            return null;
        }
        return chunk.getTile(tileX, tileY);
    }

    public readonly deaths: Set<TilePos>;

    public isTileLocked(x: number, y: number): boolean {
        return this.deaths.has(`${x},${y}`);
    }

    public lockTile(x: number, y: number): void {
        this.deaths.add(`${x},${y}`);
    }

    public *iterPattern(x: number, y: number, pattern: [number, number][]): Iterable<Tile> {
        for (const [dx, dy] of pattern) {
            yield this.getTile(x + dx, y + dy);
        }
    }

    public revealTile(x: number, y: number): void {
        if (this.isTileLocked(x, y)) {
            return;
        }
        const tile = this.getTile(x, y);
        if (tile.numFlags() != 0) return;

        if (!tile.isRevealed()) {
            if (!tile.reveal()) {
                this.lockTile(x, y);
                this.dispatchEvent('change', { x, y });
                this.dispatchEvent('death', { tile });
                return;
            } else {
                this.dispatchEvent('change', { x, y });
                this.dispatchEvent('reveal', { tile });
            }
        }

        const reveal: Tile[] = [];
        const search: Tile[] = [];

        if (tile.getNearbyMines(this) == tile.getNearbyFlags(this)) {
            search.push(tile);
        }

        outer: while (search.length > 0) {
            const tile = search.pop()!;

            // Do not auto reveal if there can be a positive mine & negative mine.
            // FIXME: This doesn't work wtffff
            if (tile instanceof TileBiomeCookiesAndCream) {
                let numCovered = 0;
                for (const neighbor of this.iterPattern(tile.x, tile.y, tile.mineSearchPattern())) {
                    if (neighbor.getNearbyFlags(this) == NEARBY_NONE) continue;
                    if (neighbor.isRevealed()) continue;
                    if (neighbor.numFlags() != 0) continue;
                    numCovered += 1;
                    if (numCovered > 1) continue outer;
                }
            }

            reveal.push(tile);

            for (const next of this.iterPattern(tile.x, tile.y, tile.mineSearchPattern())) {
                if (next.numFlags() != 0) continue;
                if (reveal.some((t) => t.x == next.x && t.y == next.y)) continue;
                if (search.some((t) => t.x == next.x && t.y == next.y)) continue;
                if (next.getNearbyMines(this) == NEARBY_NONE) {
                    search.push(next);
                } else {
                    reveal.push(next);
                }
            }
        }

        for (const tile of reveal) {
            if (tile.numFlags() != 0) continue;
            if (tile.isRevealed()) continue;

            this.dispatchEvent('change', { x: tile.x, y: tile.y });
            if (!tile.reveal()) {
                this.lockTile(tile.x, tile.y);
                this.dispatchEvent('death', { tile });
            } else {
                this.dispatchEvent('reveal', { tile });
            }
        }
    }

    public flagTile(x: number, y: number): void {
        if (this.isTileLocked(x, y)) {
            return;
        }
        const tile = this.getTile(x, y);
        if (tile.isRevealed()) return;

        const previousFlagCount = tile.numFlags();
        tile.flag();

        this.dispatchEvent('change', { x, y });
        this.dispatchEvent('flag', { tile, previousFlagCount });
    }

    public save(writer: DataWriter): void {
        writer.write_int(this.generator.seed);

        writer.write_int(this.deaths.size);
        this.deaths.forEach((death) => {
            const [x, y] = death.split(',').map((s) => Number.parseInt(s));
            writer.write_int(x);
            writer.write_int(y);
        });

        writer.write_int(this.chunks.size);
        this.chunks.forEach((chunk) => chunk.save(writer));
    }

    public static load(reader: DataReader): World {
        const seed = reader.read_int();

        const numDeaths = reader.read_int();
        const deaths: Set<TilePos> = new Set();
        for (let i = 0; i < numDeaths; i++) {
            const deathX = reader.read_int();
            const deathY = reader.read_int();
            deaths.add(`${deathX},${deathY}`);
        }

        const generator = new WorldGenerator(seed);

        const numChunks = reader.read_int();
        const chunks: Map<ChunkPos, Chunk> = new Map();
        for (let i = 0; i < numChunks; i++) {
            const chunk = Chunk.load(reader, generator);
            chunks.set(`${chunk.chunkX},${chunk.chunkY}`, chunk);
        }

        return new World(deaths, generator, chunks);
    }
}
