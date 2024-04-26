
import { clampNormal } from "$lib/Util";
import type { ParticleRenderer } from "../ParticleRenderer";
import type { ValidTile } from "../tile/Tile";
import { Particle } from "./Particle";



export class ParticleFakeTile extends Particle {
    public readonly type: 'faketile' = 'faketile';

    public readonly tile: ValidTile;

    public get opacity(): number {
        return clampNormal((2 - this.lifetime / 250) + 2);
    }

    public constructor(tile: ValidTile) {
        super();
        this.tile = tile;
    }

    public update(renderer: ParticleRenderer, dt: number): void {
        if(this.lifetime > 2000) {
            this.alive = false;
        }
    }
}


