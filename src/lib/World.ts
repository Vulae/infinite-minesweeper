
import { Chunk, type GeneratedChunk } from "./Chunk";
import { CHUNK_SIZE } from "./Constants";
import { generateTile } from "./Generator";
import { splitmix32 } from "./RNG";
import { type Tile } from "./Tile";



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

export class World {
    public readonly seed: number;
    public readonly tileSeed: number;
    public readonly biomeSeed: number;

    constructor(seed: number) {
        this.seed = seed;
        const rng = splitmix32(this.seed, false);
        this.tileSeed = rng();
        this.biomeSeed = rng();
    }

    private loadedChunks: {[key: ChunkCoordinate]: GeneratedChunk} = {};

    public generateTile(x: number, y: number): Tile {
        return generateTile(this, x, y);
    }

    public getChunk(chunkX: number, chunkY: number): Chunk {
        const loadedChunk = this.loadedChunks[`${chunkX},${chunkY}`];
        if(loadedChunk) return loadedChunk;
        return new Chunk(this, chunkX, chunkY);
    }

    public getGeneratedChunk(chunkX: number, chunkY: number): GeneratedChunk {
        const chunk = this.getChunk(chunkX, chunkY);
        if(chunk.isGenerated()) return chunk;
        const genChunk = chunk.generate();
        this.loadedChunks[`${chunkX},${chunkY}`] = genChunk;
        return genChunk;
    }

    public getTile(x: number, y: number): Tile {
        const chunkX = Math.floor(x / CHUNK_SIZE);
        const chunkY = Math.floor(y / CHUNK_SIZE);
        const chunk = this.getGeneratedChunk(chunkX, chunkY);
        return chunk.getTileAbsolute(x, y);
    }



    public flag(x: number, y: number): void {
        return this.getTile(x, y).flag();
    }

    public reveal(x: number, y: number, userClick: boolean = true): boolean {
        const tile = this.getTile(x, y);
        tile.reveal();
        if(tile.numMines() > 0) return true;
        if(tile.minesNearby() > 0) {
            if(userClick) {
                let death = false;
                if(tile.flagsNearby() == tile.minesNearby()) {
                    for(const offset of tile.searchPattern) {
                        if(this.reveal(tile.x + offset.x, tile.y + offset.y, false)) {
                            death = true;
                        }
                    }
                }
                return death;
            } else {
                return false;
            }
        }

        let reveal: Tile[] = [ ];
        let stack: Tile[] = [ tile ];

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

        reveal.forEach(t => t.reveal());

        return false;
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

}


