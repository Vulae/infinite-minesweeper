import { spiralIter } from '$lib/util';
import { generateTile } from './generator';
import type { Tile } from './tile';

const CHUNK_SIZE: number = 32;

class Chunk {
    private readonly locks: boolean[] = new Array(CHUNK_SIZE * CHUNK_SIZE).fill(false);

    private readonly tiles: Tile[] = [];

    public getTile(x: number, y: number): Tile {
        return this.tiles[y * CHUNK_SIZE + x];
    }

    public lockTile(x: number, y: number): void {
        this.locks[y * CHUNK_SIZE + x] = true;
    }

    public isLocked(x: number, y: number): boolean {
        return this.locks[y * CHUNK_SIZE + x];
    }

    public static generate(seed: number, chunkX: number, chunkY: number): Chunk {
        const chunk = new Chunk();
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let x = 0; x < CHUNK_SIZE; x++) {
                const globalX = chunkX * CHUNK_SIZE + x;
                const globalY = chunkY * CHUNK_SIZE + y;
                chunk.tiles[y * CHUNK_SIZE + x] = generateTile(seed, globalX, globalY);
            }
        }
        console.log('Generated chunk', chunkX, chunkY, chunk);
        return chunk;
    }
}

type ChunkPos = `${number},${number}`;

export class World {
    public readonly seed: number = Math.floor(Math.random() * 4294967296);

    private readonly chunks: Map<ChunkPos, Chunk> = new Map();

    private getChunk(chunkX: number, chunkY: number): Chunk {
        const key: ChunkPos = `${chunkX},${chunkY}`;
        let chunk = this.chunks.get(key);
        if (!chunk) {
            chunk = Chunk.generate(this.seed, chunkX, chunkY);
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

    public isTileLocked(x: number, y: number): boolean {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const tileX = x - chunkX * CHUNK_SIZE;
        const tileY = y - chunkY * CHUNK_SIZE;
        const chunk = this.getChunk(chunkX, chunkY);
        return chunk.isLocked(tileX, tileY);
    }

    public lockTile(x: number, y: number): void {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const tileX = x - chunkX * CHUNK_SIZE;
        const tileY = y - chunkY * CHUNK_SIZE;
        const chunk = this.getChunk(chunkX, chunkY);
        chunk.lockTile(tileX, tileY);
    }

    public *iterPattern(x: number, y: number, pattern: [number, number][]): Iterable<Tile> {
        for (const [dx, dy] of pattern) {
            yield this.getTile(x + dx, y + dy);
        }
    }

    public getMinesCount(x: number, y: number, pattern: [number, number][]): number {
        let count = 0;
        for (const tile of this.iterPattern(x, y, pattern)) {
            count += tile.numMines();
        }
        return count;
    }

    public hasNearbyMine(x: number, y: number, pattern: [number, number][]): boolean {
        for (const tile of this.iterPattern(x, y, pattern)) {
            if (tile.numMines() != 0) return true;
        }
        return false;
    }

    public getFlagsCount(x: number, y: number, pattern: [number, number][]): number {
        let count = 0;
        for (const tile of this.iterPattern(x, y, pattern)) {
            count += tile.numFlags();
        }
        return count;
    }

    public revealTile(x: number, y: number): void {
        if (this.isTileLocked(x, y)) {
            return;
        }
        const tile = this.getTile(x, y);
        if (tile.numFlags() != 0) return;
        if (!tile.reveal()) {
            this.lockTile(x, y);
            return;
        }

        const reveal: Tile[] = [];
        const search: Tile[] = [];

        if (
            this.getMinesCount(tile.x, tile.y, tile.mineSearchPattern()) ==
            this.getFlagsCount(tile.x, tile.y, tile.mineSearchPattern())
        ) {
            search.push(tile);
        }

        while (search.length > 0) {
            const tile = search.pop()!;
            reveal.push(tile);

            for (const next of this.iterPattern(tile.x, tile.y, tile.mineSearchPattern())) {
                if (reveal.some((t) => t.x == next.x && t.y == next.y)) continue;
                if (search.some((t) => t.x == next.x && t.y == next.y)) continue;
                if (!this.hasNearbyMine(next.x, next.y, next.mineSearchPattern())) {
                    search.push(next);
                } else {
                    reveal.push(next);
                }
            }
        }

        for (const tile of reveal) {
            if (tile.numFlags() != 0) continue;
            if (!tile.reveal()) {
                this.lockTile(tile.x, tile.y);
            }
        }
    }

    public flagTile(x: number, y: number): void {
        if (this.isTileLocked(x, y)) {
            return;
        }
        const tile = this.getTile(x, y);
        tile.flag();
    }

    public constructor() {
        // Auto-reveal nearest tile to (0, 0) that has 0 nearby mines.
        for (const { x, y } of spiralIter(0, 0)) {
            const tile = this.getTile(x, y);
            if (
                tile.numMines() == 0 &&
                this.getMinesCount(tile.x, tile.y, tile.mineSearchPattern()) == 0
            ) {
                this.revealTile(x, y);
                break;
            }
        }
    }
}
