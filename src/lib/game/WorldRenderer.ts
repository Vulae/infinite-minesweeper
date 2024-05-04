
import { CHUNK_SIZE } from "./Constants";
import type { Viewport } from "./Viewport";
import type { World } from "./World";
import type { Theme } from "./theme/Theme";



export class WorldRenderer {
    public readonly world: World;
    public readonly theme: Theme;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;
    public readonly viewport: Viewport;


    public constructor(world: World, theme: Theme, canvas: HTMLCanvasElement, viewport: Viewport) {
        this.world = world;
        this.theme = theme;
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if(!ctx) {
            throw new Error('This browser or machine does not support canvas 2d.');
        }
        this.ctx = ctx;
        this.viewport = viewport;
    }

    public async init(): Promise<void> { }
    public destroy(): void { }

    private renderWorld(): void {
        this.ctx.imageSmoothingEnabled = false;
        this.viewport.transformCtx(this.ctx);

        // Render tiles
        this.viewport.forEachTileInViewport(tile => {
            this.theme.drawTile(this.ctx, tile);
        }, 0);

        // Render death icons
        this.viewport.forEachChunkInViewport(chunk => {
            chunk.deaths.forEach(death => {
                this.theme.drawDeathIcon(this.ctx, chunk.chunkX * CHUNK_SIZE + death.x, chunk.chunkY * CHUNK_SIZE + death.y);
            });
        }, 0);

        this.ctx.imageSmoothingEnabled = true;
    }

    public render(): void {
        this.ctx.reset();

        // this.ctx.fillStyle = 'purple';
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderWorld();
    }
}


