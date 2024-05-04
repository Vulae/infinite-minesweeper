
import type { GeneratedChunk } from "./Chunk";
import { CHUNK_SIZE } from "./Constants";
import type { World } from "./World";
import type { ValidTile } from "./tile/Tile";



export class Viewport {
    public readonly world: World;
    private width: number = 0;
    private height: number = 0;

    constructor(world: World) {
        this.world = world;
    }

    public setSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    // Camera position in tiles
    public cameraX: number = 0;
    public cameraY: number = 0;
    // Camera tile size pixels
    public cameraZoom: number = 32;
    // Camera min & max zoom
    public cameraMinZoom: number = 4;
    public cameraMaxZoom: number = 64;

    // Camera size in tiles
    public cameraWidth(): number { return this.width / this.cameraZoom; }
    public cameraHeight(): number { return this.height / this.cameraZoom; }

    public cameraTranslate(x: number, y: number): void {
        this.cameraX -= x / this.cameraZoom;
        this.cameraY -= y / this.cameraZoom;
    }

    public forceCameraZoom(): number {
        if(this.width / this.cameraZoom < this.cameraMinZoom) {
            this.cameraZoom = this.width / this.cameraMinZoom;
        }
        if(this.height / this.cameraZoom < this.cameraMinZoom) {
            this.cameraZoom = this.height / this.cameraMinZoom;
        }
        if(this.width / this.cameraZoom > this.cameraMaxZoom) {
            this.cameraZoom = this.width / this.cameraMaxZoom;
        }
        if(this.height / this.cameraZoom > this.cameraMaxZoom) {
            this.cameraZoom = this.height / this.cameraMaxZoom;
        }
        return this.cameraZoom;
    }

    public cameraScale(scale: number): number {
        const lastCenterX = this.cameraX + this.cameraWidth() * 0.5;
        const lastCenterY = this.cameraY + this.cameraHeight() * 0.5;

        this.cameraZoom *= scale;

        this.forceCameraZoom();

        const centerX = this.cameraX + this.cameraWidth() * 0.5;
        const centerY = this.cameraY + this.cameraHeight() * 0.5;

        this.cameraX -= centerX - lastCenterX;
        this.cameraY -= centerY - lastCenterY;

        return this.cameraZoom;
    }

    public cameraBounds(margin: number = 0): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: Math.floor(this.cameraX - margin),
            minY: Math.floor(this.cameraY - margin),
            maxX: Math.ceil(this.cameraX + this.cameraWidth() + margin),
            maxY: Math.ceil(this.cameraY + this.cameraHeight() + margin)
        }
    }

    public isInCameraBounds(x: number, y: number, margin: number = 0): boolean {
        const bounds = this.cameraBounds(margin);
        return (
            x >= bounds.minX && x <= bounds.maxX &&
            y >= bounds.minY && y <= bounds.maxY
        );
    }

    public cameraPos(canvasX: number, canvasY: number): { x: number, y: number } {
        return {
            x: Math.floor(canvasX / this.cameraZoom + this.cameraX),
            y: Math.floor(canvasY / this.cameraZoom + this.cameraY),
        }
    }

    public transformCtx(ctx: CanvasRenderingContext2D): void {
        ctx.scale(this.cameraZoom, this.cameraZoom);
        ctx.translate(-this.cameraX, -this.cameraY);
    }

    public forEachTileInViewport(callbackfn: (tile: ValidTile) => void, margin: number = 0): void {
        const bounds = this.cameraBounds(margin);
        for(let x = bounds.minX; x < bounds.maxX; x++) {
            for(let y = bounds.minY; y < bounds.maxY; y++) {
                const tile = this.world.getTile(x, y);
                callbackfn(tile);
            }
        }
    }

    public forEachChunkInViewport(callbackfn: (chunk: GeneratedChunk) => void, margin: number = 0): void {
        const bounds = this.cameraBounds(margin);
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


