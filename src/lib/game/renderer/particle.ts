import { CanvasStore } from '$lib';
import { ParticleDeathTile } from './particles/deathTile';
import { ParticleRevealTile } from './particles/revealTile';
import { ParticleUnflagTile } from './particles/unflagTile';
import type { Renderer } from './renderer';
import type { EventListener } from '$lib/eventDispatcher';

export interface Particle {
    /**
     * @param dt Delta time in milliseconds
     * @returns If particle is still alive
     */
    update(dt: number): boolean;
    render(ctx: CanvasRenderingContext2D, renderer: Renderer): void;
}

export class ParticleRenderer {
    private readonly renderer: Renderer;
    private needsRerender: boolean = true;

    private readonly listeners: EventListener[] = [];

    public constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.listeners.push(
            this.renderer.game.world.addEventListener('reveal', ({ data: { tile } }) => {
                this.addParticle(new ParticleRevealTile(tile));
            }),
            this.renderer.game.world.addEventListener(
                'flag',
                ({ data: { tile, previousFlagCount } }) => {
                    if (previousFlagCount != 0 && tile.numFlags() == 0) {
                        this.addParticle(new ParticleUnflagTile(tile));
                    }
                }
            ),
            this.renderer.game.world.addEventListener('death', ({ data: { tile } }) => {
                this.addParticle(new ParticleDeathTile(tile));
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

    private readonly particles: Particle[] = [];

    public addParticle(particle: Particle): void {
        this.particles.push(particle);
        this.setNeedsRerender();
    }

    private lastFrameTime: number = -1;

    public render(): void {
        if (this.particles.length > 0) {
            this.setNeedsRerender();
            // We skip over the needs rerender check here so we get an extra frame to render the canvas with 0 particles instead of keeping the 1 particle that existed before.
        } else {
            if (!this.needsRerender) {
                this.lastFrameTime = -1;
                return;
            }
            this.needsRerender = false;
        }

        const currentFrameTime = performance.now();
        let dt: number;
        if (this.lastFrameTime == -1) {
            this.lastFrameTime = performance.now();
            dt = 0;
        } else {
            dt = currentFrameTime - this.lastFrameTime;
        }
        this.lastFrameTime = performance.now();

        const canvas = this.store.canvas;
        const ctx = this.store.ctx;

        ctx.reset();
        ctx.imageSmoothingEnabled = false;

        this.renderer.viewport.transformCtx(canvas, ctx);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }

        this.particles.forEach((particle) => {
            ctx.save();
            particle.render(ctx, this.renderer);
            ctx.restore();
        });
    }
}
