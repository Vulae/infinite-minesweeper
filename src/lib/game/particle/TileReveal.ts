
import { clampNormal } from "$lib/Util";
import type { ParticleRenderer } from "../ParticleRenderer";
import type { ValidTile } from "../tile/Tile";
import { Particle } from "./Particle";



export class ParticleTileReveal extends Particle {
    public readonly type: 'tilereveal' = 'tilereveal';

    public readonly tile: ValidTile;
    public x: number;
    public y: number;
    public dx: number;
    public dy: number;

    public r: number;
    public dr: number;

    public readonly totalLifetime: number;

    public get opacity(): number {
        return clampNormal(1 - (this.lifetime / (this.totalLifetime / 2)) + 0.5);
    }

    public constructor(tile: ValidTile) {
        super();
        this.tile = tile;

        this.x = this.tile.x;
        this.y = this.tile.y;
        this.dx = (Math.random() - 0.5) * 0.005;
        this.dy = -(Math.random() * 0.002 + 0.005);
        this.r = 0;
        this.dr = (Math.random() - 0.5) * 0.01;

        this.totalLifetime = Math.random() * 750 + 250;
    }

    public update(renderer: ParticleRenderer, dt: number): void {
        this.dy += 0.00005 * dt;

        this.dx *= 0.99;
        this.dy *= (this.dy < 0) ? 1 : 0.98;

        this.x += this.dx * dt;
        this.y += this.dy * dt;

        this.r += this.dr * dt;

        if(this.lifetime >= this.totalLifetime) {
            this.alive = false;
        }
    }
}


