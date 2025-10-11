import { CanvasStore, TextureAtlas } from '$lib';
import type { Game } from '../game';
import { Viewport } from '../viewport';
import { OverlayRenderer } from './overlay';
import { ParticleRenderer } from './particle';
import { WorldRenderer } from './world';

const TILESET = new TextureAtlas(
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
        // nearby_n: [64, 0, 16, 16],
        nearby_n1: [64, 16, 16, 16],
        nearby_n2: [64, 32, 16, 16],
        nearby_n3: [64, 48, 16, 16],
        nearby_n4: [64, 64, 16, 16],
        nearby_n5: [64, 80, 16, 16],
        nearby_n6: [64, 96, 16, 16],
        nearby_n7: [64, 112, 16, 16],
        nearby_n8: [64, 128, 16, 16],
        nearby_n9: [64, 144, 16, 16],
        nearby_n10: [64, 160, 16, 16],
        nearby_n11: [64, 176, 16, 16],
        nearby_n12: [64, 192, 16, 16],
        nearby_n13: [64, 208, 16, 16],
        nearby_n14: [64, 224, 16, 16],
        nearby_n15: [64, 240, 16, 16],
        nearby_n16: [64, 256, 16, 16],
        nearby_n17: [64, 272, 16, 16],
        nearby_n18: [64, 288, 16, 16],
        nearby_n19: [64, 304, 16, 16],
        nearby_n20: [64, 320, 16, 16],
        nearby_n21: [64, 336, 16, 16],
        nearby_n22: [64, 352, 16, 16],
        nearby_n23: [64, 368, 16, 16],
        nearby_n24: [64, 384, 16, 16],
        tile_vanilla_covered: [80, 0, 16, 16],
        tile_vanilla_uncovered: [96, 0, 16, 16],
        tile_chocolate_covered: [80, 16, 16, 16],
        tile_chocolate_uncovered: [96, 16, 16, 16],
        tile_waffle_1_covered: [80, 32, 16, 16],
        tile_waffle_1_uncovered: [96, 32, 16, 16],
        tile_waffle_2_covered: [112, 32, 16, 16],
        tile_waffle_2_uncovered: [128, 32, 16, 16],
        tile_stroopwafel_1_covered: [80, 48, 16, 16],
        tile_stroopwafel_1_uncovered: [96, 48, 16, 16],
        tile_stroopwafel_2_covered: [112, 48, 16, 16],
        tile_stroopwafel_2_uncovered: [128, 48, 16, 16],
        tile_blueberry_covered: [80, 64, 16, 16],
        tile_blueberry_uncovered: [96, 64, 16, 16],
        tile_strawberry_covered: [80, 80, 16, 16],
        tile_strawberry_uncovered: [96, 80, 16, 16],
        tile_cookiesandcream_covered: [80, 96, 16, 16],
        tile_cookiesandcream_uncovered: [96, 96, 16, 16]
    },
    '/infinite-minesweeper/tileset.png'
);
const TILESET_TILE_SIZE: number = 16;

export class Renderer {
    public readonly game: Game;
    public readonly viewport: Viewport;

    // The rendering for this game has 3 layers:
    // 1. World - Renders the base world of the game
    // 2. Particles - Renders active particles in the world
    // 3. Overlay - Renders some overlay stuff like the tile neighbors highlight
    public readonly worldRenderer: WorldRenderer;
    public readonly particleRenderer: ParticleRenderer;
    public readonly overlayRenderer: OverlayRenderer;

    public constructor(game: Game, viewport: Viewport) {
        this.game = game;
        this.viewport = viewport;
        this.worldRenderer = new WorldRenderer(this);
        this.particleRenderer = new ParticleRenderer(this);
        this.overlayRenderer = new OverlayRenderer(this);
    }

    public destroyListeners(): void {
        this.worldRenderer.destroyListeners();
        this.particleRenderer.destroyListeners();
        this.overlayRenderer.destroyListeners();
    }

    public readonly TILESET = TILESET;
    public readonly TILESET_TILE_SIZE: number = TILESET_TILE_SIZE;

    public setNeedsRerender(): void {
        this.worldRenderer.setNeedsRerender();
        this.particleRenderer.setNeedsRerender();
        this.overlayRenderer.setNeedsRerender();
    }

    public render(): void {
        this.worldRenderer.render();
        this.particleRenderer.render();
        this.overlayRenderer.render();
    }

    public screenshot(
        opts: {
            /** Screenshot tile X */
            x?: number;
            /** Screenshot tile Y */
            y?: number;
            /** Screenshot tile width */
            width?: number;
            /** Screenshot tile height */
            height?: number;
            /** Overlay renderer hover position */
            hover?: { x: number; y: number };
            /** Number of pixels per tile */
            renderScale?: number;
            onBeforeRender?: (renderer: Renderer) => unknown;
        } = {}
    ): ImageData {
        const x = Math.floor(opts.x ?? 0);
        const y = Math.floor(opts.y ?? 0);
        const width = Math.max(Math.floor(opts.width ?? 16), 1);
        const height = Math.max(Math.floor(opts.height ?? 16), 1);
        const hover = opts.hover
            ? { x: Math.floor(opts.hover.x), y: Math.floor(opts.hover.y) }
            : null;
        const renderScale = opts.renderScale ?? 16;
        const onBeforeRender = opts.onBeforeRender ?? (() => {});

        console.group('screenshot');
        console.info(`At: ${x}, ${y}`);
        console.info(`Size: ${width}, ${height}`);
        if (hover) {
            console.info(`Hover: ${hover.x}, ${hover.y}`);
        }
        console.groupEnd();

        const renderer = new Renderer(
            this.game,
            new Viewport(this.game.world, {
                x: x + width / 2,
                y: y + height / 2,
                scale: renderScale
            })
        );

        const worldStore = new CanvasStore({
            size: { width: width * renderScale, height: height * renderScale }
        });
        const particleStore = new CanvasStore({
            size: { width: width * renderScale, height: height * renderScale }
        });
        const overlayStore = new CanvasStore({
            size: { width: width * renderScale, height: height * renderScale }
        });

        renderer.worldRenderer.setCanvas(worldStore.canvas);
        renderer.particleRenderer.setCanvas(particleStore.canvas);
        renderer.overlayRenderer.setCanvas(overlayStore.canvas);

        if (hover) {
            renderer.overlayRenderer.hoverTile = { x: hover.x, y: hover.y };
        }

        onBeforeRender(renderer);

        renderer.setNeedsRerender();
        renderer.render();
        renderer.destroyListeners();

        const mergeStore = new CanvasStore({
            size: { width: width * renderScale, height: height * renderScale }
        });
        mergeStore.ctx.drawImage(worldStore.canvas, 0, 0);
        mergeStore.ctx.drawImage(particleStore.canvas, 0, 0);
        mergeStore.ctx.drawImage(overlayStore.canvas, 0, 0);

        return mergeStore.ctx.getImageData(0, 0, mergeStore.canvas.width, mergeStore.canvas.height);
    }
}
