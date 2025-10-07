import type { Tile } from '$lib/game/tile';
import { clampNormal } from '$lib/util';
import type { Particle } from '../particle';
import type { Renderer } from '../renderer';

export class ParticleDeathTile implements Particle {
    private readonly tile: Tile;

    private lifetime: number = 1000;

    public constructor(tile: Tile) {
        this.tile = tile;
    }

    public update(dt: number): boolean {
        this.lifetime -= dt;
        return this.lifetime > 0;
    }

    public render(ctx: CanvasRenderingContext2D, renderer: Renderer): void {
        const t = this.lifetime / 1000;

        ctx.globalAlpha = clampNormal(this.lifetime / 300);
        renderer.TILESET.drawTexture(ctx, this.tile.tileCoveredTexture(), this.tile.x, this.tile.y);
        ctx.globalAlpha = 1;

        switch (8 - Math.ceil(t * 8)) {
            case 0:
                renderer.TILESET.drawTexture(ctx, 'explosion_1', this.tile.x, this.tile.y);
                break;
            case 1:
                renderer.TILESET.drawTexture(ctx, 'explosion_2', this.tile.x, this.tile.y);
                break;
            case 2:
                renderer.TILESET.drawTexture(ctx, 'explosion_3', this.tile.x, this.tile.y);
                break;
            case 3:
                renderer.TILESET.drawTexture(ctx, 'explosion_4', this.tile.x, this.tile.y);
                break;
            default:
                break;
        }
    }
}
