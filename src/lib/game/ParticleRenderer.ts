
import type { EventListener } from "$lib/EventDispatcher";
import type { Viewport } from "./Viewport";
import type { World } from "./World";
import { ParticleExplosion } from "./particle/Explosion";
import { ParticleFakeTile } from "./particle/FakeTile";
import { ParticleFlag } from "./particle/Flag";
import type { ValidParticle } from "./particle/Particle";
import { ParticleTileReveal } from "./particle/TileReveal";
import type { Theme } from "./theme/Theme";



export class ParticleRenderer {
    public readonly world: World;
    public readonly theme: Theme;
    public readonly canvas: HTMLCanvasElement;
    public readonly ctx: CanvasRenderingContext2D;
    public readonly viewport: Viewport;

    public readonly particles: ValidParticle[] = [];

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
    
    private readonly listeners: EventListener[] = [];

    public async init(): Promise<void> {
        this.listeners.push(this.world.addEventListener('particle_unflag', ({ data: { x, y } }) => {
            this.particles.push(new ParticleFlag(x, y));
        }));
        this.listeners.push(this.world.addEventListener('particle_explosion', ({ data: { x, y } }) => {
            const tile = this.world.getTile(x, y);
            this.particles.push(new ParticleFakeTile(tile));
            this.particles.push(new ParticleExplosion(tile));
        }));
        this.listeners.push(this.world.addEventListener('particle_reveal', ({ data: { x, y } }) => {
            const tile = this.world.getTile(x, y);
            this.particles.push(new ParticleTileReveal(tile));
        }));
    }

    public destroy(): void {
        let listener: EventListener | undefined;
        while(listener = this.listeners.pop()) {
            this.world.removeEventListener(listener);
        }
    }

    private renderParticles(dt: number): void {
        this.ctx.imageSmoothingEnabled = false;
        this.viewport.transformCtx(this.ctx);

        for(let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.rendererUpdate(this, dt);
            if(!particle.alive) {
                this.particles.splice(i, 1);
                i--;
            }
        }

        for(const particle of this.particles) {
            this.theme.drawParticle(this.ctx, particle);
        }
 
        this.ctx.imageSmoothingEnabled = true;
    }


    
    private lastFrameTime: number = -1;

    public render(): void {
        this.ctx.reset();

        this.ctx.fillStyle = 'transparent';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const currentFrameTime = performance.now();
        if(this.lastFrameTime == -1) {
            this.renderParticles(0);
        } else {
            const dt = currentFrameTime - this.lastFrameTime;
            this.renderParticles(dt);
        }

        this.lastFrameTime = currentFrameTime;
    }
}


