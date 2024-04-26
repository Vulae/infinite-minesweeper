
import { TextureAtlas } from "../../Atlas";
import type { ValidParticle } from "../particle/Particle";
import { SingleMineTileState, type SingleMineTile } from "../tile/SingleMine";
import type { Tile, ValidTile } from "../tile/Tile";
import { waffleIsDark } from "../tile/Waffle";
import { Theme, type SoundEffect } from "./Theme";



// TODO: Clean this whole thing up!



export class ThemeRetro extends Theme {

    private readonly tileset = new TextureAtlas('/infinite-minesweeper/retro/tileset.png', {
        null: [ 0, 0, 16, 16 ],
        bomb: [ 16, 0, 16, 16 ],
        explosion1: [ 16, 16, 16, 16 ],
        explosion2: [ 16, 32, 16, 16 ],
        explosion3: [ 16, 48, 16, 16 ],
        explosion4: [ 16, 64, 16, 16 ],
        flag: [ 32, 16, 16, 16 ],
        number_0: [ 48, 0, 16, 16 ],
        number_1: [ 48, 16, 16, 16 ],
        number_2: [ 48, 32, 16, 16 ],
        number_3: [ 48, 48, 16, 16 ],
        number_4: [ 48, 64, 16, 16 ],
        number_5: [ 48, 80, 16, 16 ],
        number_6: [ 48, 96, 16, 16 ],
        number_7: [ 48, 112, 16, 16 ],
        number_8: [ 48, 128, 16, 16 ],
        tile_vanilla_covered: [ 64, 0, 16, 16 ],
        tile_vanilla_revealed: [ 80, 0, 16, 16 ],
        tile_chocolate_covered: [ 64, 16, 16, 16 ],
        tile_chocolate_revealed: [ 80, 16, 16, 16 ],
        tile_waffle_light_covered: [ 64, 32, 16, 16 ],
        tile_waffle_light_revealed: [ 80, 32, 16, 16 ],
        tile_waffle_dark_covered: [ 96, 32, 16, 16 ],
        tile_waffle_dark_revealed: [ 112, 32, 16, 16 ],
        tile_stroopwafel_light_covered: [ 64, 48, 16, 16 ],
        tile_stroopwafel_light_revealed: [ 80, 48, 16, 16 ],
        tile_stroopwafel_dark_covered: [ 96, 48, 16, 16 ],
        tile_stroopwafel_dark_revealed: [ 112, 48, 16, 16 ]
    });

    public async init(): Promise<void> {
        await this.tileset.awaitLoad();
    }



    private drawNearby(ctx: CanvasRenderingContext2D, tile: Tile): void {
        const nearby = tile.minesNearby(true);
        switch(nearby) {
            case 0: break;
            case 1: this.tileset.draw(ctx, 'number_1', 0, 0, 1, 1); break;
            case 2: this.tileset.draw(ctx, 'number_2', 0, 0, 1, 1); break;
            case 3: this.tileset.draw(ctx, 'number_3', 0, 0, 1, 1); break;
            case 4: this.tileset.draw(ctx, 'number_4', 0, 0, 1, 1); break;
            case 5: this.tileset.draw(ctx, 'number_5', 0, 0, 1, 1); break;
            case 6: this.tileset.draw(ctx, 'number_6', 0, 0, 1, 1); break;
            case 7: this.tileset.draw(ctx, 'number_7', 0, 0, 1, 1); break;
            case 8: this.tileset.draw(ctx, 'number_8', 0, 0, 1, 1); break;
            default: throw new Error('ThemeRetro invalid draw nearby count.');
        }
    }

    private drawSingleMineTile(ctx: CanvasRenderingContext2D, tile: SingleMineTile, covered: keyof typeof this.tileset.textures, revealed: keyof typeof this.tileset.textures, forceCovered: boolean): void {
        if(forceCovered) {
            this.tileset.draw(ctx, covered, 0, 0, 1, 1);
            return;
        }
        switch(tile.state) {
            case SingleMineTileState.Covered: this.tileset.draw(ctx, covered, 0, 0, 1, 1); break;
            case SingleMineTileState.Flagged: this.tileset.draw(ctx, covered, 0, 0, 1, 1); this.tileset.draw(ctx, 'flag', 0, 0, 1, 1); break;
            case SingleMineTileState.Revealed: {
                this.tileset.draw(ctx, revealed, 0, 0, 1, 1);
                if(tile.isMine) {
                    this.tileset.draw(ctx, 'bomb', 0, 0, 1, 1);
                } else {
                    this.drawNearby(ctx, tile);
                }
                break; }
        }
    }

    private drawForcedTile(ctx: CanvasRenderingContext2D, tile: ValidTile, forceCovered: boolean): void {
        switch(tile.type) {
            case 'vanilla': this.drawSingleMineTile(ctx, tile, 'tile_vanilla_covered', 'tile_vanilla_revealed', forceCovered); break;
            case 'chocolate': this.drawSingleMineTile(ctx, tile, 'tile_chocolate_covered', 'tile_chocolate_revealed', forceCovered); break;
            case 'waffle': {
                if(!waffleIsDark(2, tile.x, tile.y)) {
                    this.drawSingleMineTile(ctx, tile, 'tile_waffle_light_covered', 'tile_waffle_light_revealed', forceCovered);
                } else {
                    this.drawSingleMineTile(ctx, tile, 'tile_waffle_dark_covered', 'tile_waffle_dark_revealed', forceCovered);
                }
                break; }
            case 'stroopwafel': {
                if(!waffleIsDark(3, tile.x, tile.y)) {
                    this.drawSingleMineTile(ctx, tile, 'tile_stroopwafel_light_covered', 'tile_stroopwafel_light_revealed', forceCovered);
                } else {
                    this.drawSingleMineTile(ctx, tile, 'tile_stroopwafel_dark_covered', 'tile_stroopwafel_dark_revealed', forceCovered);
                }
                break; }
        }
    }

    public drawTile(ctx: CanvasRenderingContext2D, tile: ValidTile): void {
        this.drawForcedTile(ctx, tile, false);
    }
    


    public drawParticle(ctx: CanvasRenderingContext2D, particle: ValidParticle): void {

        ctx.save();

        switch(particle.type) {
            case 'flag': {
                ctx.translate(particle.x + 0.5, particle.y + 0.5);
                ctx.rotate(particle.r);
                ctx.globalAlpha = particle.opacity;
                this.tileset.draw(ctx, 'flag', -0.5, -0.5, 1, 1);
                break; }
            case 'explosion': {
                const explosionTextures: (keyof typeof this.tileset.textures)[] = [ 'explosion1', 'explosion2', 'explosion3', 'explosion4' ];
                const index = Math.min(Math.floor((particle.lifetime / particle.maxLifetime) * explosionTextures.length), explosionTextures.length - 1);
                this.tileset.draw(ctx, explosionTextures[index], particle.tile.x, particle.tile.y, 1, 1);
                break; }
            case 'faketile': {
                ctx.translate(particle.tile.x, particle.tile.y);
                ctx.globalAlpha = particle.opacity;
                this.drawForcedTile(ctx, particle.tile, true);
                break; }
            case 'tilereveal': {
                ctx.translate(particle.x + 0.5, particle.y + 0.5);
                ctx.rotate(particle.r);
                ctx.translate(-0.5, -0.5);
                ctx.globalAlpha = particle.opacity;
                this.drawForcedTile(ctx, particle.tile, true);
                break; }
        }

        ctx.globalAlpha = 1;
        ctx.restore();

    }



    public readonly soundEffects: {[key in SoundEffect]: { src: string, variation: number }} = {
        'reveal': { src: '/infinite-minesweeper/retro/reveal.wav', variation: 0.25 },
        'unflag': { src: '/infinite-minesweeper/retro/unflag.wav', variation: 0.25 },
        'explosion': { src: '/infinite-minesweeper/retro/explosion.wav', variation: 0.25 },
    };

}


