import { CanvasStore } from '$lib';
import type { Tile } from '../tile';
import { NEARBY_NONE } from '../world';
import type { Renderer } from './renderer';
import type { EventListener } from '$lib/eventDispatcher';

type ChunkPos = `${number},${number}`;

function doesAABBintersect(
    a: { minX: number; minY: number; maxX: number; maxY: number },
    b: { minX: number; minY: number; maxX: number; maxY: number }
): boolean {
    return !(a.minX > b.maxX || a.maxX < b.minX || a.minY > b.maxY || a.maxY < b.minY);
}

class HighresWorldRenderer {
    public readonly CHUNK_SIZE: number = 16;

    private readonly renderer: Renderer;

    public constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.chunkCanvas = new CanvasStore({
            size: {
                width: this.CHUNK_SIZE * this.renderer.TILESET_TILE_SIZE,
                height: this.CHUNK_SIZE * this.renderer.TILESET_TILE_SIZE
            },
            willReadFrequently: true,
            alpha: false
        });
    }

    private readonly chunkCache: Map<ChunkPos, ImageData> = new Map();

    public invalidate(tileX: number, tileY: number): void {
        const chunkX = Math.floor(tileX / this.CHUNK_SIZE);
        const chunkY = Math.floor(tileY / this.CHUNK_SIZE);
        this.chunkCache.delete(`${chunkX},${chunkY}`);
    }

    private invalidateOutsideOfViewport(
        canvas: HTMLCanvasElement,
        margin: number = this.CHUNK_SIZE
    ): void {
        const bounds = this.renderer.viewport.bounds(canvas, true, margin);
        const screenAABB = {
            minX: Math.floor(bounds.minX),
            minY: Math.floor(bounds.minY),
            maxX: Math.ceil(bounds.maxX),
            maxY: Math.ceil(bounds.maxY)
        };

        this.chunkCache.forEach((_, chunkPos) => {
            const [chunkX, chunkY] = chunkPos.split(',').map((s) => Number.parseInt(s));
            if (
                !doesAABBintersect(screenAABB, {
                    minX: chunkX * this.CHUNK_SIZE,
                    minY: chunkY * this.CHUNK_SIZE,
                    maxX: chunkX * this.CHUNK_SIZE + this.CHUNK_SIZE,
                    maxY: chunkY * this.CHUNK_SIZE + this.CHUNK_SIZE
                })
            ) {
                this.chunkCache.delete(chunkPos);
            }
        });
    }

    private readonly chunkCanvas: CanvasStore;

    private getChunkImageData(chunkX: number, chunkY: number): ImageData {
        const chunkPos: ChunkPos = `${chunkX},${chunkY}`;
        if (!this.chunkCache.has(chunkPos)) {
            const canvas = this.chunkCanvas.canvas;
            const ctx = this.chunkCanvas.ctx;
            ctx.reset();

            ctx.scale(this.renderer.TILESET_TILE_SIZE, this.renderer.TILESET_TILE_SIZE);

            for (let dx = 0; dx < this.CHUNK_SIZE; dx++) {
                for (let dy = 0; dy < this.CHUNK_SIZE; dy++) {
                    const x = chunkX * this.CHUNK_SIZE + dx;
                    const y = chunkY * this.CHUNK_SIZE + dy;

                    const tile = this.renderer.game.world.getTile(x, y);

                    ctx.save();
                    ctx.translate(dx, dy);
                    tile.render(ctx, this.renderer);
                    ctx.restore();

                    if (this.renderer.game.world.isTileLocked(tile.x, tile.y)) {
                        ctx.save();
                        ctx.translate(dx, dy);
                        this.renderer.TILESET.drawTexture(ctx, 'skull');
                        ctx.restore();
                    }
                }
            }

            this.chunkCache.set(chunkPos, ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
        return this.chunkCache.get(chunkPos)!;
    }

    public render(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        this.invalidateOutsideOfViewport(canvas);

        ctx.reset();
        ctx.imageSmoothingEnabled = false;

        this.renderer.viewport.transformCtx(canvas, ctx);

        const bounds = this.renderer.viewport.bounds(canvas, true);
        const minX = Math.floor(bounds.minX / this.CHUNK_SIZE);
        const minY = Math.floor(bounds.minY / this.CHUNK_SIZE);
        const maxX = Math.ceil(bounds.maxX / this.CHUNK_SIZE);
        const maxY = Math.ceil(bounds.maxY / this.CHUNK_SIZE);

        for (let chunkX = minX; chunkX < maxX; chunkX++) {
            for (let chunkY = minY; chunkY < maxY; chunkY++) {
                const chunk = this.getChunkImageData(chunkX, chunkY);
                this.chunkCanvas.ctx.reset();
                this.chunkCanvas.ctx.putImageData(chunk, 0, 0);
                ctx.drawImage(
                    this.chunkCanvas.canvas,
                    chunkX * this.CHUNK_SIZE,
                    chunkY * this.CHUNK_SIZE,
                    this.CHUNK_SIZE,
                    this.CHUNK_SIZE
                );
            }
        }
    }
}

// TODO: Different levels of mipmaps for infinite zoom
class LowresWorldRenderer {
    public readonly CHUNK_SIZE: number = 64;

    private readonly renderer: Renderer;

    public constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    private readonly chunkCache: Map<ChunkPos, ImageData> = new Map();

    public invalidate(tileX: number, tileY: number): void {
        const chunkX = Math.floor(tileX / this.CHUNK_SIZE);
        const chunkY = Math.floor(tileY / this.CHUNK_SIZE);
        this.chunkCache.delete(`${chunkX},${chunkY}`);
    }

    private invalidateOutsideOfViewport(
        canvas: HTMLCanvasElement,
        margin: number = this.CHUNK_SIZE
    ): void {
        const bounds = this.renderer.viewport.bounds(canvas, true, margin);
        const screenAABB = {
            minX: Math.floor(bounds.minX),
            minY: Math.floor(bounds.minY),
            maxX: Math.ceil(bounds.maxX),
            maxY: Math.ceil(bounds.maxY)
        };

        this.chunkCache.forEach((_, chunkPos) => {
            const [chunkX, chunkY] = chunkPos.split(',').map((s) => Number.parseInt(s));
            if (
                !doesAABBintersect(screenAABB, {
                    minX: chunkX * this.CHUNK_SIZE,
                    minY: chunkY * this.CHUNK_SIZE,
                    maxX: chunkX * this.CHUNK_SIZE + this.CHUNK_SIZE,
                    maxY: chunkY * this.CHUNK_SIZE + this.CHUNK_SIZE
                })
            ) {
                this.chunkCache.delete(chunkPos);
            }
        });
    }

    private getChunkImageData(chunkX: number, chunkY: number): ImageData {
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
        if (!this.chunkCache.has(chunkPos)) {
            const image = new ImageData(this.CHUNK_SIZE, this.CHUNK_SIZE);

            for (let dx = 0; dx < this.CHUNK_SIZE; dx++) {
                for (let dy = 0; dy < this.CHUNK_SIZE; dy++) {
                    const x = chunkX * this.CHUNK_SIZE + dx;
                    const y = chunkY * this.CHUNK_SIZE + dy;

                    let tile = this.renderer.game.world.getTileDoNotGenerate(x, y);
                    if (tile === null) {
                        tile = this.renderer.game.world.generator.generateTile(x, y);
                    }

                    const color = colorModifyTile(tile.color(), tile);
                    const i = dx + dy * this.CHUNK_SIZE;
                    image.data[i * 4 + 0] = (color & 0xff0000) >> 16;
                    image.data[i * 4 + 1] = (color & 0x00ff00) >> 8;
                    image.data[i * 4 + 2] = color & 0x0000ff;
                    image.data[i * 4 + 3] = 0xff;
                }
            }

            this.chunkCache.set(chunkPos, image);
        }
        return this.chunkCache.get(chunkPos)!;
    }

    private readonly chunkCanvas: CanvasStore = new CanvasStore({
        size: { width: this.CHUNK_SIZE, height: this.CHUNK_SIZE }
    });

    public render(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        this.invalidateOutsideOfViewport(canvas);

        ctx.reset();
        ctx.imageSmoothingEnabled = false;

        this.renderer.viewport.transformCtx(canvas, ctx);

        const bounds = this.renderer.viewport.bounds(canvas, true);
        const minX = Math.floor(bounds.minX / this.CHUNK_SIZE);
        const minY = Math.floor(bounds.minY / this.CHUNK_SIZE);
        const maxX = Math.ceil(bounds.maxX / this.CHUNK_SIZE);
        const maxY = Math.ceil(bounds.maxY / this.CHUNK_SIZE);
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                const chunk = this.getChunkImageData(x, y);
                this.chunkCanvas.ctx.putImageData(chunk, 0, 0);
                ctx.drawImage(this.chunkCanvas.canvas, x * this.CHUNK_SIZE, y * this.CHUNK_SIZE);
            }
        }
    }
}

export class WorldRenderer {
    private readonly renderer: Renderer;
    private needsRerender: boolean = true;

    private readonly highresRenderer: HighresWorldRenderer;
    private readonly lowresRenderer: LowresWorldRenderer;

    private readonly listeners: EventListener[] = [];

    public constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.highresRenderer = new HighresWorldRenderer(this.renderer);
        this.lowresRenderer = new LowresWorldRenderer(this.renderer);
        this.listeners.push(
            this.renderer.game.world.addEventListener('change', ({ data: { x, y } }) => {
                this.highresRenderer.invalidate(x, y);
                this.lowresRenderer.invalidate(x, y);
                this.setNeedsRerender();
            })
        );
    }

    public destroyListeners(): void {
        this.listeners.forEach((listener) => listener.destroy());
    }

    private store: CanvasStore = new CanvasStore({
        alpha: false
    });

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

    public isLowres(): boolean {
        return this.renderer.viewport.scale < 16;
    }

    private __render_debug_chunk_overlay(chunkSize: number): void {
        const canvas = this.store.canvas;
        const ctx = this.store.ctx;

        ctx.resetTransform();

        this.renderer.viewport.transformCtx(canvas, ctx);

        const bounds = this.renderer.viewport.bounds(canvas, true);
        const minX = Math.floor(bounds.minX / chunkSize);
        const minY = Math.floor(bounds.minY / chunkSize);
        const maxX = Math.ceil(bounds.maxX / chunkSize);
        const maxY = Math.ceil(bounds.maxY / chunkSize);
        for (let x = minX; x < maxX; x++) {
            for (let y = minY; y < maxY; y++) {
                ctx.fillStyle =
                    (x + y) % 2 == 0 ? 'rgba(255, 76, 76, 0.3)' : 'rgba(76, 76, 255, 0.3)';
                ctx.fillRect(x * chunkSize, y * chunkSize, chunkSize, chunkSize);
            }
        }
    }

    public render(): void {
        if (!this.needsRerender) return;
        this.needsRerender = false;
        if (!this.isLowres()) {
            this.highresRenderer.render(this.store.canvas, this.store.ctx);
        } else {
            this.lowresRenderer.render(this.store.canvas, this.store.ctx);
        }

        // this.__render_debug_chunk_overlay(
        //     !this.isLowres() ? this.highresRenderer.CHUNK_SIZE : this.lowresRenderer.CHUNK_SIZE
        // );
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
