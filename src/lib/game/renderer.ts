import { CanvasStore, TextureAtlas } from '$lib';
import { TileBiomeStrawberry } from './biomes/strawberry';
import type { Game } from './game';
import type { Tile } from './tile';
import { Viewport } from './viewport';
import { NEARBY_NONE, type World } from './world';

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

export class Renderer {
    public readonly TILESET = new TextureAtlas(
        {
            null: [0, 0, 16, 16],
            skull: [0, 16, 16, 16],
            bomb: [16, 0, 16, 16],
            explosion_1: [16, 16, 16, 16],
            explosion_2: [16, 32, 16, 16],
            explosion_3: [16, 48, 16, 16],
            explosion_4: [16, 64, 16, 16],
            no_flag: [32, 0, 16, 16],
            flag: [32, 16, 16, 16],
            flag_inversed: [32, 32, 16, 16],
            flag_1: [32, 48, 16, 16],
            flag_2: [32, 64, 16, 16],
            flag_3: [32, 80, 16, 16],
            flag_inversed_1: [32, 96, 16, 16],
            flag_inversed_2: [32, 112, 16, 16],
            flag_inversed_3: [32, 128, 16, 16],
            nearby_0: [48, 0, 16, 16],
            nearby_1: [48, 16, 16, 16],
            nearby_2: [48, 32, 16, 16],
            nearby_3: [48, 48, 16, 16],
            nearby_4: [48, 64, 16, 16],
            nearby_5: [48, 80, 16, 16],
            nearby_6: [48, 96, 16, 16],
            nearby_7: [48, 112, 16, 16],
            nearby_8: [48, 128, 16, 16],
            nearby_9: [48, 144, 16, 16],
            nearby_10: [48, 160, 16, 16],
            nearby_11: [48, 176, 16, 16],
            nearby_12: [48, 192, 16, 16],
            nearby_13: [48, 208, 16, 16],
            nearby_14: [48, 224, 16, 16],
            nearby_15: [48, 240, 16, 16],
            nearby_16: [48, 256, 16, 16],
            nearby_17: [48, 272, 16, 16],
            nearby_18: [48, 288, 16, 16],
            nearby_19: [48, 304, 16, 16],
            nearby_20: [48, 320, 16, 16],
            nearby_21: [48, 336, 16, 16],
            nearby_22: [48, 352, 16, 16],
            nearby_23: [48, 368, 16, 16],
            nearby_24: [48, 384, 16, 16],
            tile_vanilla_covered: [80, 0, 16, 16],
            tile_vanilla_uncovered: [96, 0, 16, 16],
            tile_chocolate_covered: [80, 16, 16, 16],
            tile_chocolate_uncovered: [96, 16, 16, 16],
            tile_blueberry_covered: [80, 64, 16, 16],
            tile_blueberry_uncovered: [96, 64, 16, 16],
            tile_strawberry_covered: [80, 80, 16, 16],
            tile_strawberry_uncovered: [96, 80, 16, 16]
        },
        '/infinite-minesweeper/tileset.png'
    );

    public readonly game: Game;
    public readonly world: World;

    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    public readonly viewport: Viewport;

    public constructor(game: Game) {
        this.game = game;
        this.world = this.game.world;
        this.viewport = new Viewport(this.game.world);
        this.viewport.addEventListener('change', () => this.render());
    }

    public setCanvas(canvas: HTMLCanvasElement | null) {
        console.log('Setting canvas', canvas);
        this.canvas = canvas;
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d')!;
        }
    }

    public hoverTile: { x: number; y: number } | null = null;

    private readonly outlineRenderer: OutlineRenderer = new OutlineRenderer();

    public render() {
        if (!this.canvas || !this.ctx) return;

        this.ctx.reset();
        this.ctx.imageSmoothingEnabled = false;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.viewport.transformCtx(this.canvas, this.ctx);

        this.viewport.forEachTileInViewport(this.canvas, (tile) => {
            this.ctx!.save();
            this.ctx!.translate(tile.x, tile.y);
            tile.render(this.ctx!, this);
            this.ctx!.restore();

            if (this.world.isTileLocked(tile.x, tile.y)) {
                this.ctx!.save();
                this.ctx!.translate(tile.x, tile.y);
                this.TILESET.drawTexture(this.ctx!, 'skull');
                this.ctx!.restore();
            }
        });

        if (this.hoverTile) {
            const hoverTile = this.world.getTile(this.hoverTile.x, this.hoverTile.y);

            if (hoverTile instanceof TileBiomeStrawberry) {
                this.ctx.save();
                this.ctx.translate(hoverTile.x, hoverTile.y);

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
                this.ctx.drawImage(outline, -2 - p, -2 - p, 5 + p * 2, 5 + p * 2);

                this.ctx.restore();
            }
        }
    }

    public renderNearbyNumber(ctx: CanvasRenderingContext2D, n: number) {
        if (n < 0 || n > 24) {
            console.warn('Invalid nearby number to render:', n);
            return;
        }
        // @ts-expect-error The check above doesn't narrow the type enough
        this.TILESET.drawTexture(ctx, `nearby_${n}`, 0, 0, 1, 1);
    }

    public renderNearbyNumberTile(ctx: CanvasRenderingContext2D, tile: Tile) {
        const nearby = tile.getNearbyMines(this.world);
        if (nearby != NEARBY_NONE) {
            this.renderNearbyNumber(ctx, nearby as number);
        }
    }
}
