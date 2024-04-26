
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

        const bounds = this.viewport.cameraBounds(1);
        for(let x = bounds.minX; x < bounds.maxX; x++) {
            for(let y = bounds.minY; y < bounds.maxY; y++) {
                this.ctx.save();
                this.ctx.translate(x, y);
                // We need to oversize each tile to prevent gaps between tiles due to fp precision loss.
                // TODO: Dynamically set this based on cameraZoom
                // this.ctx.translate(0.5, 0.5);
                // this.ctx.scale(1.01, 1.01);
                // this.ctx.translate(-0.5, -0.5);

                const tile = this.world.getTile(x, y);
                this.theme.drawTile(this.ctx, tile);

                this.ctx.restore();
            }
        }
        this.ctx.imageSmoothingEnabled = true;
    }

    public render(): void {
        this.ctx.reset();

        // this.ctx.fillStyle = 'purple';
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderWorld();
    }
}


