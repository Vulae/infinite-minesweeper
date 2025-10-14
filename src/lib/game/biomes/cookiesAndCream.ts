import type { BitReader, BitWriter } from '$lib/io';
import type { Renderer } from '../renderer/renderer';
import { BASIC_PATTERN, Tile } from '../tile';

enum TileCookiesAndCreamState {
    Covered,
    Revealed,
    Flagged,
    AntiFlagged
}

export enum TileCookiesAndCreamMine {
    None,
    Mine,
    AntiMine
}

export class TileBiomeCookiesAndCream extends Tile {
    private readonly _mine: TileCookiesAndCreamMine;
    private _state: TileCookiesAndCreamState = TileCookiesAndCreamState.Covered;

    public constructor(x: number, y: number, mine: TileCookiesAndCreamMine) {
        super(x, y);
        this._mine = mine;
    }

    public mineSearchPattern(): [number, number][] {
        return BASIC_PATTERN;
    }

    public numMines(): number {
        switch (this._mine) {
            case TileCookiesAndCreamMine.None:
                return 0;
            case TileCookiesAndCreamMine.Mine:
                return 1;
            case TileCookiesAndCreamMine.AntiMine:
                return -1;
        }
    }

    public numFlags(): number {
        switch (this._state) {
            case TileCookiesAndCreamState.Flagged:
                return 1;
            case TileCookiesAndCreamState.AntiFlagged:
                return -1;
            default:
                return 0;
        }
    }

    public isRevealed(): boolean {
        return this._state === TileCookiesAndCreamState.Revealed;
    }

    public flag(): void {
        switch (this._state) {
            case TileCookiesAndCreamState.Covered:
                this._state = TileCookiesAndCreamState.Flagged;
                break;
            case TileCookiesAndCreamState.Flagged:
                this._state = TileCookiesAndCreamState.AntiFlagged;
                break;
            case TileCookiesAndCreamState.AntiFlagged:
                this._state = TileCookiesAndCreamState.Covered;
                break;
        }
    }

    public reveal(): boolean {
        switch (this._mine) {
            case TileCookiesAndCreamMine.None: {
                this._state = TileCookiesAndCreamState.Revealed;
                return true;
            }
            case TileCookiesAndCreamMine.Mine: {
                this._state = TileCookiesAndCreamState.Flagged;
                return false;
            }
            case TileCookiesAndCreamMine.AntiMine: {
                this._state = TileCookiesAndCreamState.AntiFlagged;
                return false;
            }
        }
    }

    public render(ctx: CanvasRenderingContext2D, renderer: Renderer): void {
        switch (this._state) {
            case TileCookiesAndCreamState.Covered: {
                renderer.TILESET.drawTexture(ctx, 'tile_cookiesandcream_covered');
                break;
            }
            case TileCookiesAndCreamState.Revealed: {
                renderer.TILESET.drawTexture(ctx, 'tile_cookiesandcream_uncovered');
                renderer.worldRenderer.renderNearbyNumberTile(ctx, this);
                break;
            }
            case TileCookiesAndCreamState.Flagged: {
                renderer.TILESET.drawTexture(ctx, 'tile_cookiesandcream_covered');
                renderer.TILESET.drawTexture(ctx, 'flag');
                break;
            }
            case TileCookiesAndCreamState.AntiFlagged: {
                renderer.TILESET.drawTexture(ctx, 'tile_cookiesandcream_covered');
                renderer.TILESET.drawTexture(ctx, 'flag_inversed');
                break;
            }
        }
    }

    public color(): number {
        return 0xdfdfdf;
    }

    public tileCoveredTexture(): keyof Renderer['TILESET']['textures'] {
        return 'tile_cookiesandcream_covered';
    }

    public tileFinalFlagTexture(): keyof Renderer['TILESET']['textures'] {
        return 'flag_inversed';
    }

    public save(writer: BitWriter): void {
        switch (this._state) {
            case TileCookiesAndCreamState.Covered: {
                writer.write_bit(false);
                break;
            }
            case TileCookiesAndCreamState.Revealed: {
                writer.write_bit(true);
                writer.write_bit(false);
                break;
            }
            case TileCookiesAndCreamState.AntiFlagged: {
                writer.write_bit(true);
                writer.write_bit(true);
                writer.write_bit(false);
                break;
            }
            case TileCookiesAndCreamState.Flagged: {
                writer.write_bit(true);
                writer.write_bit(true);
                writer.write_bit(true);
                break;
            }
        }
    }

    public load(reader: BitReader): void {
        if (!reader.read_bit()) {
            this._state = TileCookiesAndCreamState.Covered;
            return;
        }
        if (!reader.read_bit()) {
            this._state = TileCookiesAndCreamState.Revealed;
            return;
        }
        if (!reader.read_bit()) {
            this._state = TileCookiesAndCreamState.AntiFlagged;
        } else {
            this._state = TileCookiesAndCreamState.Flagged;
        }
    }
}
