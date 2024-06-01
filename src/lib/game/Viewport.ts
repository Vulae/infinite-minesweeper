
import { EventDispatcher } from "$lib/EventDispatcher";
import type { GeneratedChunk } from "./Chunk";
import { CHUNK_SIZE } from "./Constants";
import type { World } from "./World";
import type { ValidTile } from "./tile/Tile";



export class Viewport extends EventDispatcher<{
    'change': null;
}> {
    public change(): void {
        this.dispatchEvent('change', null);
    }

    public readonly world: World;

    constructor(world: World, viewport?: { x: number, y: number, scale: number }) {
        super();
        this.world = world;
        if(viewport) {
            this.load(viewport);
        }
    }


    
    /** Viewport center X */
    public x: number = 0;
    /** Viewport center Y */
    public y: number = 0;
    /** Viewport tile scale in pixels */
    public scale: number = 64;



    public load(viewport: { x: number, y: number, scale: number }): void {
        this.x = viewport.x;
        this.y = viewport.y;
        this.scale = viewport.scale;
    }

    public save(): { x: number, y: number, scale: number } {
        return {
            x: this.x,
            y: this.y,
            scale: this.scale
        }
    }



    public translate(canvas: HTMLCanvasElement, dx: number, dy: number): void {
        this.x -= dx / this.scale;
        this.y -= dy / this.scale;
    }

    public scaleFrom(canvas: HTMLCanvasElement, newScale: number, aroundX: number, aroundY: number): void {
        const lastCenterX = this.x + (canvas.width / this.scale) * (aroundX / canvas.width - 0.5);
        const lastCenterY = this.y + (canvas.height / this.scale) * (aroundY / canvas.height - 0.5);

        this.scale = newScale;

        const centerX = this.x + (canvas.width / this.scale) * (aroundX / canvas.width - 0.5);
        const centerY = this.y + (canvas.height / this.scale) * (aroundY / canvas.height - 0.5);

        this.x -= centerX - lastCenterX;
        this.y -= centerY - lastCenterY;
    }

    public clampScale(canvas: HTMLCanvasElement, scale: number, minTiles: number, maxTiles: number): number {
        if(canvas.width / scale < minTiles) {
            scale = canvas.width / minTiles;
        }
        if(canvas.height / scale < minTiles) {
            scale = canvas.height / minTiles;
        }
        if(canvas.width / scale > maxTiles) {
            scale = canvas.width / maxTiles;
        }
        if(canvas.height / scale > maxTiles) {
            scale = canvas.height / maxTiles;
        }

        return scale;
    }



    public bounds(canvas: HTMLCanvasElement, round: boolean, margin: number = 0): { minX: number, minY: number, maxX: number, maxY: number } {
        const minX = this.x - canvas.width / this.scale / 2 - margin;
        const minY = this.y - canvas.height / this.scale / 2 - margin;
        const maxX = this.x + canvas.width / this.scale / 2 + margin;
        const maxY = this.y + canvas.height / this.scale / 2 + margin;
        return round ? {
            minX: Math.floor(minX),
            minY: Math.floor(minY),
            maxX: Math.ceil(maxX),
            maxY: Math.ceil(maxY)
        } : {
            minX, minY, maxX, maxY
        }
    }

    public inBounds(canvas: HTMLCanvasElement, x: number, y: number, margin: number = 0): boolean {
        const bounds = this.bounds(canvas, false, margin);
        return (
            x >= bounds.minX && x <= bounds.maxX &&
            y >= bounds.minY && y <= bounds.maxY
        );
    }

    public intersects(x: number, y: number, width: number, height: number, canvas: HTMLCanvasElement, round: boolean, margin: number = 0): boolean {
        const bounds = this.bounds(canvas, round, margin);
        if(bounds.maxX < x || x + width < bounds.minX) return false;
        if(bounds.maxY < y || y + height < bounds.minY) return false;
        return true;
    }

    public canvasPos(canvas: HTMLCanvasElement, x: number, y: number, floor: boolean): { x: number, y: number } {
        const cX = (x - canvas.width / 2) / this.scale + this.x;
        const cY = (y - canvas.height / 2) / this.scale + this.y;
        return floor ? {
            x: Math.floor(cX),
            y: Math.floor(cY)
        } : {
            x: cX, y: cY
        }
    }



    public transformCtx(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.x, -this.y);
    }

    public forEachTileInViewport(canvas: HTMLCanvasElement, callbackfn: (tile: ValidTile) => void, margin: number = 0): void {
        const bounds = this.bounds(canvas, true, margin);
        for(let x = bounds.minX; x < bounds.maxX; x++) {
            for(let y = bounds.minY; y < bounds.maxY; y++) {
                const tile = this.world.getTile(x, y);
                callbackfn(tile);
            }
        }
    }

    public forEachChunkInViewport(canvas: HTMLCanvasElement, callbackfn: (chunk: GeneratedChunk) => void, margin: number = 0): void {
        const bounds = this.bounds(canvas, true, margin);
        bounds.minX = Math.floor(bounds.minX / CHUNK_SIZE);
        bounds.minY = Math.floor(bounds.minY / CHUNK_SIZE);
        bounds.maxX = Math.ceil(bounds.maxX / CHUNK_SIZE);
        bounds.maxY = Math.ceil(bounds.maxY / CHUNK_SIZE);
        for(let x = bounds.minX; x < bounds.maxX; x++) {
            for(let y = bounds.minY; y < bounds.maxY; y++) {
                const chunk = this.world.getChunk(x, y);
                if(!chunk.isGenerated()) continue;
                callbackfn(chunk);
            }
        }
    }

}


