
import { BitIO } from "../BitIO";
import { CHUNK_SIZE } from "./Constants";
import { generateTile, getTileType } from "./Generator";
import type { World } from "./World";
import type { ValidTile } from "./tile/Tile";



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

        const tiles: ValidTile[] = [];

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
    public readonly tiles: ValidTile[];

    public constructor(world: World, chunkX: number, chunkY: number, tiles: ValidTile[]) {
        super(world, chunkX, chunkY);
        this.tiles = tiles;
        if(this.tiles.length != CHUNK_SIZE * CHUNK_SIZE) {
            throw new Error('GeneratedChunk incorrect tiles length.');
        }
    }

    public getTileAbsolute(tileX: number, tileY: number): ValidTile {
        return this.getTile(tileX - this.chunkX * CHUNK_SIZE, tileY - this.chunkY * CHUNK_SIZE);
    }

    public getTile(chunkTileX: number, chunkTileY: number): ValidTile {
        return this.tiles[chunkTileX + chunkTileY * CHUNK_SIZE]!;
    }

    public resetTileAbsolute(tileX: number, tileY: number): void {
        return this.resetTile(tileX - this.chunkX * CHUNK_SIZE, tileY - this.chunkY * CHUNK_SIZE);
    }

    public resetTile(chunkTileX: number, chunkTileY: number): void {
        this.tiles[chunkTileX + chunkTileY * CHUNK_SIZE] = generateTile(this.world, this.chunkX * CHUNK_SIZE + chunkTileX, this.chunkY * CHUNK_SIZE + chunkTileY);
    }



    public encodeTiles(): ArrayBuffer {
        const io = new BitIO(2048);
        for(const tile of this.tiles) {
            tile.save(io);
        }
        return io.final();
    }

    public static decodeTiles(world: World, chunkX: number, chunkY: number, buffer: ArrayBuffer): GeneratedChunk {
        const io = new BitIO(buffer);
        let tiles: ValidTile[] = [];
        for(let dy = 0; dy < CHUNK_SIZE; dy++) {
            for(let dx = 0; dx < CHUNK_SIZE; dx++) {
                const x = chunkX * CHUNK_SIZE + dx;
                const y = chunkY * CHUNK_SIZE + dy;
                const tileConstructor = getTileType(world, x, y);
                const tile = tileConstructor.load(world, x, y, io);
                tiles.push(tile);
            }
        }
        return new GeneratedChunk(world, chunkX, chunkY, tiles);
    }
}




