import { CanvasStore } from '$lib';
import type { Tile } from '../tile';
import { NEARBY_NONE } from '../world';
import type { Renderer } from './renderer';
import type { EventListener } from '$lib/eventDispatcher';

const CHUNK_SIZE: number = 32;
type ChunkPos = `${number},${number}`;

export class WorldRenderer {
    private readonly renderer: Renderer;
    private needsRerender: boolean = true;

    private readonly listeners: EventListener[] = [];

    public constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.listeners.push(
            this.renderer.game.world.addEventListener('change', ({ data: { x, y } }) => {
                const chunkX = Math.floor(x / CHUNK_SIZE);
                const chunkY = Math.floor(y / CHUNK_SIZE);
                this.cacheZoomoutChunks.delete(`${chunkX},${chunkY}`);
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

    private renderHighres(): void {
        const canvas = this.store.canvas;
        const ctx = this.store.ctx;

        ctx.reset();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.renderer.viewport.transformCtx(canvas, ctx);

        this.renderer.viewport.forEachTileInViewport(canvas, (tile) => {
            ctx.save();
            ctx.translate(tile.x, tile.y);
            tile.render(ctx, this.renderer);
            ctx.restore();

            // if (this.renderer.game.world.isTileLocked(tile.x, tile.y)) {
            //     ctx.save();
            //     ctx.translate(tile.x, tile.y);
            //     this.renderer.TILESET.drawTexture(ctx, 'skull');
            //     ctx.restore();
            // }
        });
    }

    private readonly cacheZoomoutChunks: Map<ChunkPos, ImageData> = new Map();

    public isLowres(): boolean {
        return this.renderer.viewport.scale < 16;
    }

    private getLowresChunk(chunkX: number, chunkY: number): ImageData {
        function colorModifyTile(color: number, tile: Tile): number {
            if (tile.isRevealed()) {
                const r = (color & 0xff0000) >> 16;
                const g = (color & 0x00ff00) >> 8;
                const b = color & 0x0000ff;
                const dr = Math.floor(r * 0.8);
                const dg = Math.floor(g * 0.8);
                const db = Math.floor(b * 0.8);
                return (dr << 16) | (dg << 8) | db;
            } else if (tile.numFlags() != 0) {
                const r = (color & 0xff0000) >> 16;
                const g = (color & 0x00ff00) >> 8;
                const b = color & 0x0000ff;
                const rr = Math.min(Math.floor(r + 100), 255);
                const dg = Math.floor(g * 0.6);
                const db = Math.floor(b * 0.6);
                return (rr << 16) | (dg << 8) | db;
            } else {
                return color;
            }
        }

        const chunkPos: ChunkPos = `${chunkX},${chunkY}`;
        if (!this.cacheZoomoutChunks.has(chunkPos)) {
            const image = new ImageData(CHUNK_SIZE, CHUNK_SIZE);
            for (let dx = 0; dx < CHUNK_SIZE; dx++) {
                for (let dy = 0; dy < CHUNK_SIZE; dy++) {
                    const x = chunkX * CHUNK_SIZE + dx;
                    const y = chunkY * CHUNK_SIZE + dy;
                    let tile = this.renderer.game.world.getTileDoNotGenerate(x, y);
                    if (tile === null) {
                        tile = this.renderer.game.world.generator.generateTile(x, y);
                    }
                    const color = colorModifyTile(tile.color(), tile);
                    const i = dx + dy * CHUNK_SIZE;
                    image.data[i * 4 + 0] = (color & 0xff0000) >> 16;
                    image.data[i * 4 + 1] = (color & 0x00ff00) >> 8;
                    image.data[i * 4 + 2] = color & 0x0000ff;
                    image.data[i * 4 + 3] = 0xff;
                }
            }
            this.cacheZoomoutChunks.set(chunkPos, image);
        }
        return this.cacheZoomoutChunks.get(chunkPos)!;
    }

    private readonly lowresCanvas: CanvasStore = new CanvasStore({
        size: { width: CHUNK_SIZE, height: CHUNK_SIZE }
    });

    private renderLowres(): void {
        const canvas = this.store.canvas;
        const ctx = this.store.ctx;

        ctx.reset();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.renderer.viewport.transformCtx(canvas, ctx);

        const bounds = this.renderer.viewport.bounds(canvas, true);
        const minX = Math.floor(bounds.minX / CHUNK_SIZE);
        const minY = Math.floor(bounds.minY / CHUNK_SIZE);
        const maxX = Math.ceil(bounds.maxX / CHUNK_SIZE);
        const maxY = Math.ceil(bounds.maxY / CHUNK_SIZE);
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                const lowres = this.getLowresChunk(x, y);
                this.lowresCanvas.ctx.putImageData(lowres, 0, 0);
                ctx.drawImage(this.lowresCanvas.canvas, x * CHUNK_SIZE, y * CHUNK_SIZE);
            }
        }
    }

    public render(): void {
        if (!this.needsRerender) return;
        this.needsRerender = false;
        if (!this.isLowres()) {
            this.renderHighres();
        } else {
            this.renderLowres();
        }
    }

    private renderNearbyNumber(ctx: CanvasRenderingContext2D, n: number) {
        if (n < 0) {
            if (n < -24) {
                console.warn('Invalid nearby number to render:', n);
                return;
            }
            // @ts-expect-error The check above doesn't narrow the type enough
            this.renderer.TILESET.drawTexture(ctx, `nearby_n${Math.abs(n)}`);
        } else {
            if (n > 24) {
                console.warn('Invalid nearby number to render:', n);
                return;
            }
            // @ts-expect-error The check above doesn't narrow the type enough
            this.renderer.TILESET.drawTexture(ctx, `nearby_${n}`, 0, 0, 1, 1);
        }
    }

    public renderNearbyNumberTile(ctx: CanvasRenderingContext2D, tile: Tile) {
        const nearby = tile.getNearbyMines(this.renderer.game.world);
        if (nearby != NEARBY_NONE) {
            this.renderNearbyNumber(ctx, nearby as number);
        }
    }
}
