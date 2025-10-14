import type { Tile } from '$lib/game/tile';
import { clampNormal } from '$lib/util';
import type { Particle } from '../particle';
import type { Renderer } from '../renderer';

export class ParticleRevealTile implements Particle {
    private readonly tile: Tile;

    private x: number;
    private y: number;

    private dx: number;
    private dy: number;

    private r: number;
    private dr: number;

    private readonly totalLifetime: number;
    private lifetime: number;

    public constructor(tile: Tile) {
        this.tile = tile;
        this.x = this.tile.x;
        this.y = this.tile.y;
        this.dx = (Math.random() - 0.5) * 0.005;
        this.dy = -(Math.random() * 0.002 + 0.005);
        this.r = 0;
        this.dr = (Math.random() - 0.5) * 0.01;
        this.totalLifetime = Math.random() * 750 + 250;
        this.lifetime = this.totalLifetime;
    }

    public update(dt: number): boolean {
        this.dy += 0.00005 * dt;

        this.dx *= 0.99;
        this.dy *= this.dy < 0 ? 1 : 0.98;

        this.x += this.dx * dt;
        this.y += this.dy * dt;

        this.r += this.dr * dt;

        this.lifetime -= dt;
        return this.lifetime > 0;
    }

    public render(ctx: CanvasRenderingContext2D, renderer: Renderer): void {
        ctx.translate(this.x + 0.5, this.y + 0.5);
        ctx.rotate(this.r);
        ctx.translate(-0.5, -0.5);
        ctx.globalAlpha = clampNormal(this.lifetime / (this.totalLifetime / 2));
        renderer.TILESET.drawTexture(ctx, this.tile.tileCoveredTexture());
    }
}
