import { tileset, tilesetNumberTexture } from "./Assets";
import type { World } from "./World";



export abstract class Tile {
    public readonly world: World;
    public readonly x: number;
    public readonly y: number;

    public constructor(world: World, x: number, y: number) {
        this.world = world;
        this.x = x;
        this.y = y;
    }

    public abstract readonly pattern: { x: number, y: number }[];
    /** Number of mines in this tile. */
    public abstract mines(): number;
    public abstract flag(): void;
    /** Returns if this reveal is a bomb.  */ 
    public abstract reveal(): boolean;
    /** Number of mines nearby. */
    public nearby(): number {
        let count: number = 0;
        for(const offset of this.pattern) {
            count += this.world.getTile(this.x + offset.x, this.y + offset.y).mines();
        }
        return count;
    }
    /** ctx is transformed to tile local coordinates. */
    public abstract render(ctx: CanvasRenderingContext2D): void;
}



export class VanillaTile extends Tile {
    private readonly isMine: boolean;
    private state: 'covered' | 'flagged' | 'revealed' = 'covered';

    public constructor(world: World, x: number, y: number) {
        super(world, x, y);
        this.isMine = this.world.rng.tileRNG(this.x, this.y, 0) > 0.7;
    }

    public readonly pattern: { x: number, y: number }[] = [
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: -1 },
        { x: 0, y: -1 },
        { x: -1, y: -1 }
    ];

    public mines(): number {
        return (this.isMine ? 1 : 0);
    }

    public flag(): void {
        if(this.state == 'revealed') return;
        this.state = (this.state == 'covered') ? 'flagged' : 'covered';
    }

    public reveal(): boolean {
        this.state = 'revealed';
        return this.isMine;
    }

    public render(ctx: CanvasRenderingContext2D): void {
        if(this.state == 'covered') {
            tileset.draw(ctx, 'tile_covered', 0, 0, 1, 1);
        } else if(this.state == 'flagged') {
            tileset.draw(ctx, 'tile_covered', 0, 0, 1, 1);
            tileset.draw(ctx, 'flag', 0, 0, 1, 1);
        } else if(this.state == 'revealed') {
            tileset.draw(ctx, 'tile_revealed', 0, 0, 1, 1);
            if(this.isMine) {
                tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
            } else {
                tileset.draw(ctx, tilesetNumberTexture(this.nearby()), 0, 0, 1, 1);
            }
        }
    }
}


