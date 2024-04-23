
import type { World } from "./World";



export class WorldRenderer {
    public readonly world: World;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;

    constructor(world: World, canvas: HTMLCanvasElement) {
        this.world = world;
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if(!ctx) {
            throw new Error('This browser or machine does not support canvas 2d.');
        }
        this.ctx = ctx;
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
    public cameraWidth(): number { return this.canvas.width / this.cameraZoom; }
    public cameraHeight(): number { return this.canvas.height / this.cameraZoom; }

    public cameraTranslate(x: number, y: number): void {
        this.cameraX -= x / this.cameraZoom;
        this.cameraY -= y / this.cameraZoom;
    }

    /**
     * Scale camera zoom
     * @returns - New camera zoom
     */
    public cameraScale(scale: number): number {
        const lastCenterX = this.cameraX + this.cameraWidth() * 0.5;
        const lastCenterY = this.cameraY + this.cameraHeight() * 0.5;

        this.cameraZoom *= scale;
        if(this.canvas.width / this.cameraZoom < this.cameraMinZoom) {
            this.cameraZoom = this.canvas.width / this.cameraMinZoom;
        }
        if(this.canvas.height / this.cameraZoom < this.cameraMinZoom) {
            this.cameraZoom = this.canvas.height / this.cameraMinZoom;
        }
        if(this.canvas.width / this.cameraZoom > this.cameraMaxZoom) {
            this.cameraZoom = this.canvas.width / this.cameraMaxZoom;
        }
        if(this.canvas.height / this.cameraZoom > this.cameraMaxZoom) {
            this.cameraZoom = this.canvas.height / this.cameraMaxZoom;
        }

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

    public cameraPos(canvasX: number, canvasY: number): { x: number, y: number } {
        return {
            x: Math.floor(canvasX / this.cameraZoom + this.cameraX),
            y: Math.floor(canvasY / this.cameraZoom + this.cameraY),
        }
    }



    private renderWorld(): void {
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.scale(this.cameraZoom, this.cameraZoom);
        this.ctx.translate(-this.cameraX, -this.cameraY);

        const bounds = this.cameraBounds(1);
        for(let x = bounds.minX; x < bounds.maxX; x++) {
            for(let y = bounds.minY; y < bounds.maxY; y++) {
                this.ctx.save();
                this.ctx.translate(x, y);
                // We need to oversize each tile to prevent gaps between tiles due to fp precision loss.
                // TODO: Dynamically set this based on cameraZoom
                this.ctx.scale(1.01, 1.01);

                const tile = this.world.getTile(x, y);
                tile.render(this.ctx);

                this.ctx.restore();
            }
        }
        this.ctx.imageSmoothingEnabled = true;
    }

    public render(): void {
        this.ctx.reset();

        this.ctx.fillStyle = 'purple';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderWorld();
    }
}


