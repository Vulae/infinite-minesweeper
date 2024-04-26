
import { clampNormal } from "$lib/Util";
import type { ParticleRenderer } from "../ParticleRenderer";
import { Particle } from "./Particle";



export class ParticleFlag extends Particle {
    public readonly type: 'flag' = 'flag';

    public x: number;
    public y: number;
    public dx: number;
    public dy: number;

    public r: number;
    public dr: number;

    public get opacity(): number {
        return clampNormal(1 - (this.lifetime / 250) + 0.5);
    }

    public constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 0.005;
        this.dy = -(Math.random() * 0.002 + 0.005);
        this.r = 0;
        this.dr = (Math.random() - 0.5) * 0.01;
    }

    public update(renderer: ParticleRenderer, dt: number): void {
        this.dy += 0.00005 * dt;

        this.dx *= 0.99;
        this.dy *= (this.dy < 0) ? 1 : 0.95;

        this.x += this.dx * dt;
        this.y += this.dy * dt;

        this.r += this.dr * dt;

        if(this.lifetime >= 500) {
            this.alive = false;
        }
    }
}


