import { EventDispatcher } from '$lib/eventDispatcher';
import { TileBiomeCookiesAndCream } from './biomes/cookiesAndCream';
import { WorldGenerator } from './generator';
import type { Tile } from './tile';

export const NEARBY_NONE: symbol = Symbol('NEARBY_NONE');

const CHUNK_SIZE: number = 32;

class Chunk {
    private readonly tiles: Tile[] = [];

    public getTile(x: number, y: number): Tile {
        return this.tiles[y * CHUNK_SIZE + x];
    }

    public static generate(chunkX: number, chunkY: number, generator: WorldGenerator): Chunk {
        if (!Number.isInteger(chunkX) || !Number.isInteger(chunkY)) {
            throw new Error(`Invalid chunk pos: ${chunkX}, ${chunkY}`);
        }
        const chunk = new Chunk();
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
}

type ChunkPos = `${number},${number}`;

type TilePos = `${number},${number}`;

export class World extends EventDispatcher<{
    change: { x: number; y: number };
    death: { tile: Tile };
    reveal: { tile: Tile };
    flag: { tile: Tile; previousFlagCount: number };
}> {
    public readonly generator: WorldGenerator = new WorldGenerator(
        Math.floor(Math.random() * 4294967296)
    );

    private readonly chunks: Map<ChunkPos, Chunk> = new Map();

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

    public readonly deaths: Set<TilePos> = new Set();

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

            this.dispatchEvent('change', { x, y });
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
}
