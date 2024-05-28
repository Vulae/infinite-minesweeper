
import { TextureAtlas } from "../../Atlas";
import type { ValidParticle } from "../particle/Particle";
import type { MultiMineTile } from "../tile/MultiMine";
import { SingleMineTileState, type SingleMineTile } from "../tile/SingleMine";
import { StrawberryTileSecondaryMines, type StrawberryTile } from "../tile/biome/Strawberry";
import { TILE_NONE_NEARBY, type ValidTile } from "../tile/Tile";
import { Theme, type SoundEffect } from "./Theme";
import { SingleAntiMineTileState, type SingleAntiMineTile } from "../tile/SingleAntiMine";



// TODO: Clean this whole thing up!



export class ThemeRetro extends Theme {

    private tileset = new TextureAtlas('/infinite-minesweeper/retro/tileset.png', {
        null: [ 0, 0, 16, 16 ],
        skull: [ 0, 16, 16, 16 ],
        bomb: [ 16, 0, 16, 16 ],
        explosion1: [ 16, 16, 16, 16 ],
        explosion2: [ 16, 32, 16, 16 ],
        explosion3: [ 16, 48, 16, 16 ],
        explosion4: [ 16, 64, 16, 16 ],
        flag: [ 32, 16, 16, 16 ],
        flag_1: [ 32, 48, 16, 16 ],
        flag_2: [ 32, 64, 16, 16 ],
        flag_3: [ 32, 80, 16, 16 ],
        flag_anti: [ 32, 32, 16, 16 ],
        flag_anti_1: [ 32, 96, 16, 16 ],
        flag_anti_2: [ 32, 112, 16, 16 ],
        flag_anti_3: [ 32, 128, 16, 16 ],
        number_0: [ 48, 0, 16, 16 ],
        number_1: [ 48, 16, 16, 16 ],
        number_2: [ 48, 32, 16, 16 ],
        number_3: [ 48, 48, 16, 16 ],
        number_4: [ 48, 64, 16, 16 ],
        number_5: [ 48, 80, 16, 16 ],
        number_6: [ 48, 96, 16, 16 ],
        number_7: [ 48, 112, 16, 16 ],
        number_8: [ 48, 128, 16, 16 ],
        number_9: [ 48, 144, 16, 16 ],
        number_10: [ 48, 160, 16, 16 ],
        number_11: [ 48, 176, 16, 16 ],
        number_12: [ 48, 192, 16, 16 ],
        number_13: [ 48, 208, 16, 16 ],
        number_14: [ 48, 224, 16, 16 ],
        number_15: [ 48, 240, 16, 16 ],
        number_16: [ 48, 256, 16, 16 ],
        number_17: [ 48, 272, 16, 16 ],
        number_18: [ 48, 288, 16, 16 ],
        number_19: [ 48, 304, 16, 16 ],
        number_20: [ 48, 320, 16, 16 ],
        number_21: [ 48, 336, 16, 16 ],
        number_22: [ 48, 352, 16, 16 ],
        number_23: [ 48, 368, 16, 16 ],
        number_24: [ 48, 384, 16, 16 ],
        number_negative_sign: [ 96, 96, 16, 16 ],
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
        tile_stroopwafel_dark_revealed: [ 112, 48, 16, 16 ],
        tile_blueberry_covered: [ 64, 64, 16, 16 ],
        tile_blueberry_revealed: [ 80, 64, 16, 16 ],
        tile_strawberry_covered: [ 64, 80, 16, 16 ],
        tile_strawberry_revealed: [ 80, 80, 16, 16 ],
        tile_cookies_and_cream_covered: [ 64, 96, 16, 16 ],
        tile_cookies_and_cream_revealed: [ 80, 96, 16, 16 ],
    });

    public async init(): Promise<void> {
        await this.tileset.awaitLoad();
        // Repack tileset (To prevent texture bleeding)
        this.tileset = this.tileset.toImageDataAtlas().toImageAtlas(true);
    }



    private drawNearby(ctx: CanvasRenderingContext2D, minesNearby: number | TILE_NONE_NEARBY): void {
        if(minesNearby == TILE_NONE_NEARBY) return;
        if(minesNearby < 0) {
            ctx.save();

            ctx.scale(0.55, 0.55);
            ctx.translate(0.1, 0.45);
            this.tileset.draw(ctx, 'number_negative_sign', 0, 0, 1, 1);
            // FIXME CLEANUP: This is just a hack to get the right color on the minus sign.
            ctx.fillStyle = [
                '#FFFFFF',
                '#0026FF',
                '#267F00',
                '#BA0000',
                '#00137F',
                '#7F0000',
                '#008080',
                '#33D137',
                '#9400D8',
                '#E48C00',
                '#FF8F9F',
                '#FF8F00',
                '#598CAA',
                '#F03E69'
            ][-minesNearby] ?? 'white';
            ctx.fillRect(0.25 - 0.004, 0.4375 - 0.004, 0.4375 + 0.008, 0.125 + 0.008);

            ctx.translate(0.7, 0);
            this.drawNearby(ctx, -minesNearby);
            ctx.restore();

            return;
        }
        switch(minesNearby) {
            case 0: this.tileset.draw(ctx, 'number_0', 0, 0, 1, 1); break;
            case 1: this.tileset.draw(ctx, 'number_1', 0, 0, 1, 1); break;
            case 2: this.tileset.draw(ctx, 'number_2', 0, 0, 1, 1); break;
            case 3: this.tileset.draw(ctx, 'number_3', 0, 0, 1, 1); break;
            case 4: this.tileset.draw(ctx, 'number_4', 0, 0, 1, 1); break;
            case 5: this.tileset.draw(ctx, 'number_5', 0, 0, 1, 1); break;
            case 6: this.tileset.draw(ctx, 'number_6', 0, 0, 1, 1); break;
            case 7: this.tileset.draw(ctx, 'number_7', 0, 0, 1, 1); break;
            case 8: this.tileset.draw(ctx, 'number_8', 0, 0, 1, 1); break;
            case 9: this.tileset.draw(ctx, 'number_9', 0, 0, 1, 1); break;
            case 10: this.tileset.draw(ctx, 'number_10', 0, 0, 1, 1); break;
            case 11: this.tileset.draw(ctx, 'number_11', 0, 0, 1, 1); break;
            case 12: this.tileset.draw(ctx, 'number_12', 0, 0, 1, 1); break;
            case 13: this.tileset.draw(ctx, 'number_13', 0, 0, 1, 1); break;
            case 14: this.tileset.draw(ctx, 'number_14', 0, 0, 1, 1); break;
            case 15: this.tileset.draw(ctx, 'number_15', 0, 0, 1, 1); break;
            case 16: this.tileset.draw(ctx, 'number_16', 0, 0, 1, 1); break;
            case 17: this.tileset.draw(ctx, 'number_17', 0, 0, 1, 1); break;
            case 18: this.tileset.draw(ctx, 'number_18', 0, 0, 1, 1); break;
            case 19: this.tileset.draw(ctx, 'number_19', 0, 0, 1, 1); break;
            case 20: this.tileset.draw(ctx, 'number_20', 0, 0, 1, 1); break;
            case 21: this.tileset.draw(ctx, 'number_21', 0, 0, 1, 1); break;
            case 22: this.tileset.draw(ctx, 'number_22', 0, 0, 1, 1); break;
            case 23: this.tileset.draw(ctx, 'number_23', 0, 0, 1, 1); break;
            case 24: this.tileset.draw(ctx, 'number_24', 0, 0, 1, 1); break;
            default: throw new Error(`ThemeRetro invalid draw nearby count. ${minesNearby}`);
        }
    }

    private drawFlags(ctx: CanvasRenderingContext2D, numFlags: number): void {
        switch(numFlags) {
            case 0: break;
            case 1: this.tileset.draw(ctx, 'flag_1', 0, 0, 1, 1); break;
            case 2: this.tileset.draw(ctx, 'flag_2', 0, 0, 1, 1); break;
            case 3: this.tileset.draw(ctx, 'flag_3', 0, 0, 1, 1); break;
            case -1: this.tileset.draw(ctx, 'flag_anti_1', 0, 0, 1, 1); break;
            case -2: this.tileset.draw(ctx, 'flag_anti_2', 0, 0, 1, 1); break;
            case -3: this.tileset.draw(ctx, 'flag_anti_3', 0, 0, 1, 1); break;
            default: throw new Error('ThemeRetro invalid draw flag count.');
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
                this.drawNearby(ctx, tile.minesNearby());
                break; }
        }
    }

    private drawMultiMineTile(ctx: CanvasRenderingContext2D, tile: MultiMineTile, covered: keyof typeof this.tileset.textures, revealed: keyof typeof this.tileset.textures, forceCovered: boolean) {
        if(forceCovered) {
            this.tileset.draw(ctx, covered, 0, 0, 1, 1);
            return;
        }
        if(!tile.isRevealed) {
            this.tileset.draw(ctx, covered, 0, 0, 1, 1);
            this.drawFlags(ctx, tile.numFlags());
        } else {
            this.tileset.draw(ctx, revealed, 0, 0, 1, 1);
            this.drawNearby(ctx, tile.minesNearby());
        }
    }

    private drawStrawberryTile(ctx: CanvasRenderingContext2D, tile: StrawberryTile, forceCovered: boolean): void {
        if(forceCovered) {
            this.tileset.draw(ctx, 'tile_strawberry_covered', 0, 0, 1, 1);
            return;
        }
        switch(tile.state) {
            case SingleMineTileState.Covered: this.tileset.draw(ctx, 'tile_strawberry_covered', 0, 0, 1, 1); break;
            case SingleMineTileState.Flagged: this.tileset.draw(ctx, 'tile_strawberry_covered', 0, 0, 1, 1); this.tileset.draw(ctx, 'flag', 0, 0, 1, 1); break;
            case SingleMineTileState.Revealed: {
                this.tileset.draw(ctx, 'tile_strawberry_revealed', 0, 0, 1, 1);

                const nearby1 = tile.minesNearby(true);
                const nearby2 = tile.secondaryMinesNearby(true);
                if(nearby2 == null) {
                    this.drawNearby(ctx, nearby1);
                } else {
                    ctx.save();
                    ctx.scale(0.55, 0.55);
                    ctx.translate(0.1, 0.45);
                    this.drawNearby(ctx, tile.secondaryNearbyMines == StrawberryTileSecondaryMines.Right ? nearby1 : nearby2);
                    ctx.translate(0.7, 0);
                    this.drawNearby(ctx, tile.secondaryNearbyMines == StrawberryTileSecondaryMines.Right ? nearby2 : nearby1);
                    ctx.restore();
                }
                break; }
        }
    }

    private drawSingleAntiMineTile(ctx: CanvasRenderingContext2D, tile: SingleAntiMineTile, covered: keyof typeof this.tileset.textures, revealed: keyof typeof this.tileset.textures, forceCovered: boolean): void {
        if(forceCovered) {
            this.tileset.draw(ctx, covered, 0, 0, 1, 1);
            return;
        }
        switch(tile.state) {
            case SingleAntiMineTileState.Covered: this.tileset.draw(ctx, covered, 0, 0, 1, 1); break;
            case SingleAntiMineTileState.Flagged: this.tileset.draw(ctx, covered, 0, 0, 1, 1); this.tileset.draw(ctx, 'flag', 0, 0, 1, 1); break;
            case SingleAntiMineTileState.AntiFlagged: this.tileset.draw(ctx, covered, 0, 0, 1, 1); this.tileset.draw(ctx, 'flag_anti', 0, 0, 1, 1); break;
            case SingleAntiMineTileState.Revealed: {
                this.tileset.draw(ctx, revealed, 0, 0, 1, 1);
                this.drawNearby(ctx, tile.minesNearby());
                break; }
        }
    }

    private drawForcedTile(ctx: CanvasRenderingContext2D, tile: ValidTile, forceCovered: boolean): void {
        switch(tile.type) {
            case 'vanilla': this.drawSingleMineTile(ctx, tile, 'tile_vanilla_covered', 'tile_vanilla_revealed', forceCovered); break;
            case 'chocolate': this.drawSingleMineTile(ctx, tile, 'tile_chocolate_covered', 'tile_chocolate_revealed', forceCovered); break;
            case 'waffle': {
                if(!tile.isDark) {
                    this.drawSingleMineTile(ctx, tile, 'tile_waffle_light_covered', 'tile_waffle_light_revealed', forceCovered);
                } else {
                    this.drawSingleMineTile(ctx, tile, 'tile_waffle_dark_covered', 'tile_waffle_dark_revealed', forceCovered);
                }
                break; }
            case 'stroopwafel': {
                if(!tile.isDark) {
                    this.drawSingleMineTile(ctx, tile, 'tile_stroopwafel_light_covered', 'tile_stroopwafel_light_revealed', forceCovered);
                } else {
                    this.drawSingleMineTile(ctx, tile, 'tile_stroopwafel_dark_covered', 'tile_stroopwafel_dark_revealed', forceCovered);
                }
                break; }
            case 'blueberry': {
                this.drawMultiMineTile(ctx, tile, 'tile_blueberry_covered', 'tile_blueberry_revealed', forceCovered);
                break; }
            case 'strawberry': {
                this.drawStrawberryTile(ctx, tile, forceCovered);
                break; }
            case 'cookies_and_cream': {
                this.drawSingleAntiMineTile(ctx, tile, 'tile_cookies_and_cream_covered', 'tile_cookies_and_cream_revealed', forceCovered);
                break; }
        }
    }

    public drawTile(ctx: CanvasRenderingContext2D, tile: ValidTile): void {
        ctx.save();
        ctx.translate(tile.x, tile.y);
        this.drawForcedTile(ctx, tile, false);
        ctx.restore();
    }
    


    public drawParticle(ctx: CanvasRenderingContext2D, particle: ValidParticle): void {
        ctx.save();

        switch(particle.type) {
            case 'flag': {
                ctx.translate(particle.x + 0.5, particle.y + 0.5);
                ctx.rotate(particle.r);
                ctx.globalAlpha = particle.opacity;
                if(!particle.isMultiFlag) {
                    if(particle.numFlags == 1) {
                        this.tileset.draw(ctx, 'flag', -0.5, -0.5, 1, 1);
                    } else {
                        this.tileset.draw(ctx, 'flag_anti', -0.5, -0.5, 1, 1);
                    }
                } else {
                    ctx.translate(-0.5, -0.5);
                    this.drawFlags(ctx, particle.numFlags);
                }
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

    public drawDeathIcon(ctx: CanvasRenderingContext2D, tileX: number, tileY: number): void {
        this.tileset.draw(ctx, 'skull', tileX, tileY, 1, 1);
    }



    public readonly soundEffects: {[key in SoundEffect]: { src: string, variation: number }} = {
        'reveal': { src: '/infinite-minesweeper/retro/reveal.wav', variation: 0.25 },
        'unflag': { src: '/infinite-minesweeper/retro/unflag.wav', variation: 0.25 },
        'explosion': { src: '/infinite-minesweeper/retro/explosion.wav', variation: 0.25 },
    };

}


