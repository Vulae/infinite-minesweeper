
import { CHUNK_SIZE } from "./Constants";
import type { Tile } from "./Tile";
import type { World } from "./World";



export class Chunk {
    public readonly world: World;

    public readonly chunkX: number;
    public readonly chunkY: number;

    public constructor(world: World, chunkX: number, chunkY: number) {
        this.world = world;
        this.chunkX = chunkX;
        this.chunkY = chunkY;
    }

    public isGenerated(): this is GeneratedChunk {
        return this instanceof GeneratedChunk;
    }

    public generate(): GeneratedChunk {
        if(this.isGenerated()) {
            throw new Error('Cannot generate an already generated chunk.');
        }

        console.log(`Generating new chunk: ${this.chunkX}, ${this.chunkY}`);

        const tiles: Tile[] = [];

        for(let dy = 0; dy < CHUNK_SIZE; dy++) {
            for(let dx = 0; dx < CHUNK_SIZE; dx++) {
                const tile = this.world.generateTile((this.chunkX * CHUNK_SIZE) + dx, (this.chunkY * CHUNK_SIZE) + dy);
                tiles.push(tile);
            }
        }

        return new GeneratedChunk(this.world, this.chunkX, this.chunkY, tiles);
    }
}



export class GeneratedChunk extends Chunk {
    public readonly tiles: Tile[];

    public constructor(world: World, chunkX: number, chunkY: number, tiles: Tile[]) {
        super(world, chunkX, chunkY);
        this.tiles = tiles;
        if(this.tiles.length != CHUNK_SIZE * CHUNK_SIZE) {
            throw new Error('GeneratedChunk incorrect tiles length.');
        }
    }

    public getTileAbsolute(tileX: number, tileY: number): Tile {
        return this.getTile(tileX - this.chunkX * CHUNK_SIZE, tileY - this.chunkY * CHUNK_SIZE);
    }

    public getTile(chunkTileX: number, chunkTileY: number): Tile {
        return this.tiles[chunkTileX + chunkTileY * CHUNK_SIZE]!;
    }
}




