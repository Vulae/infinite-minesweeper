
import type { ParticleRenderer } from "../ParticleRenderer";
import type { ValidTile } from "../tile/Tile";
import { Particle } from "./Particle";



export class ParticleExplosion extends Particle {
    public readonly type: 'explosion' = 'explosion';

    public readonly maxLifetime: number = 500;

    public readonly tile: ValidTile;

    public constructor(tile: ValidTile) {
        super();
        this.tile = tile;
    }

    public update(renderer: ParticleRenderer, dt: number): void {
        if(this.lifetime > this.maxLifetime) {
            this.alive = false;
        }
    }
}


