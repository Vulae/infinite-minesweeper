import { CanvasStore } from '$lib';
import { TileBiomeStrawberry } from '../biomes/strawberry';
import type { Renderer } from './renderer';
import type { EventListener } from '$lib/eventDispatcher';

class OutlineRenderer {
    private readonly canvas: CanvasStore = new CanvasStore();

    public makeOutline(
        tile_size: number,
        num_tiles: number,
        pos: [number, number][],
        color: string = 'white',
        outline_width: number = 1,
        overlay_color: string | null = null
    ): HTMLCanvasElement {
        const canvas = this.canvas.canvas;
        const ctx = this.canvas.ctx;

        canvas.width = tile_size * num_tiles + outline_width * 2;
        canvas.height = tile_size * num_tiles + outline_width * 2;

        ctx.reset();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(outline_width, outline_width);
        ctx.translate(tile_size * Math.floor(num_tiles / 2), tile_size * Math.floor(num_tiles / 2));

        // Draw boxes + 1 size
        ctx.fillStyle = color;
        for (const [x, y] of pos) {
            ctx.fillRect(
                x * tile_size - outline_width,
                y * tile_size - outline_width,
                tile_size + outline_width * 2,
                tile_size + outline_width * 2
            );
        }
        // Clear boxes at actual size
        for (const [x, y] of pos) {
            ctx.clearRect(x * tile_size, y * tile_size, tile_size, tile_size);
        }
        // Extra overlay color
        if (overlay_color !== null) {
            ctx.fillStyle = overlay_color;
            for (const [x, y] of pos) {
                ctx.fillRect(x * tile_size, y * tile_size, tile_size, tile_size);
            }
        }

        return canvas;
    }
}

export class OverlayRenderer {
    private readonly renderer: Renderer;
    private needsRerender: boolean = true;

    private readonly listeners: EventListener[] = [];

    public constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.listeners.push(
            this.renderer.game.world.addEventListener('change', ({ data: { x, y } }) => {
                if (this.hoverTile !== null) {
                    if (this.hoverTile.x == x && this.hoverTile.y == y) {
                        this.setNeedsRerender();
                    }
                }
            })
        );
    }

    public destroyListeners(): void {
        this.listeners.forEach((listener) => listener.destroy());
    }

    private store: CanvasStore = new CanvasStore();

    public setCanvas(canvas: HTMLCanvasElement | null): void {
        if (canvas === null) {
            this.store = new CanvasStore();
        } else {
            this.store = new CanvasStore(canvas);
        }
    }

    public setNeedsRerender(): void {
        this.needsRerender = true;
    }

    public hoverTile: { x: number; y: number } | null = null;

    private readonly outlineRenderer: OutlineRenderer = new OutlineRenderer();

    public render(): void {
        if (!this.needsRerender) return;
        this.needsRerender = false;

        const canvas = this.store.canvas;
        const ctx = this.store.ctx;

        ctx.reset();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.renderer.viewport.transformCtx(canvas, ctx);

        if (this.hoverTile) {
            const hoverTile = this.renderer.game.world.getTile(this.hoverTile.x, this.hoverTile.y);

            if (hoverTile instanceof TileBiomeStrawberry && hoverTile.isRevealed()) {
                ctx.save();
                ctx.translate(hoverTile.x, hoverTile.y);

                const outlineWidth = 2;
                const outline = this.outlineRenderer.makeOutline(
                    16,
                    5,
                    [[0, 0], ...hoverTile.mineSearchPattern()],
                    // `oklch(0.72 0.17 ${(Date.now() / 10) % 360})`,
                    'black',
                    outlineWidth,
                    'rgba(0, 0, 0, 0.2)'
                );
                const p = (1 / 16) * outlineWidth;
                ctx.drawImage(outline, -2 - p, -2 - p, 5 + p * 2, 5 + p * 2);

                ctx.restore();
            }
        }
    }
}
