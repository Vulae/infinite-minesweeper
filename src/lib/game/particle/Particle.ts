
import type { ParticleRenderer } from "../ParticleRenderer";
import type { ParticleExplosion } from "./Explosion";
import type { ParticleFakeTile } from "./FakeTile";
import type { ParticleFlag } from "./Flag";
import type { ParticleTileReveal } from "./TileReveal";



export abstract class Particle {
    public abstract readonly type: string;

    private _alive: boolean = true;
    public get alive(): boolean {
        return this._alive;
    }
    protected set alive(alive: boolean) {
        this._alive = alive;
    }

    private _lifetime: number = 0;
    /** Particle lifetime in milliseconds */
    public get lifetime(): number {
        return this._lifetime;
    }

    public abstract update(renderer: ParticleRenderer, dt: number): void;

    public rendererUpdate(renderer: ParticleRenderer, dt: number): void {
        this._lifetime += dt;
        this.update(renderer, dt);
    }
}



// TODO: Probably rename above to ParticleBase and rename below type to just Particle.
export type ValidParticle = ParticleFlag | ParticleExplosion | ParticleFakeTile | ParticleTileReveal;


