import type { BitReader, BitWriter } from '$lib/io';
import type { Renderer } from '../renderer/renderer';
import { BASIC_PATTERN, Tile } from '../tile';

export class TileBiomeBlueberry extends Tile {
    private readonly _numMines: number;
    private _numFlags: number = 0;
    private _isRevealed: boolean = false;

    public constructor(x: number, y: number, numMines: number) {
        super(x, y);
        if (numMines < 0 || numMines > 3) {
            throw new Error('numMines must be between 0 and 3');
        }
        this._numMines = numMines;
    }

    public mineSearchPattern(): [number, number][] {
        return BASIC_PATTERN;
    }

    public numMines(): number {
        return this._numMines;
    }

    public numFlags(): number {
        return this._numFlags;
    }

    public isRevealed(): boolean {
        return this._isRevealed;
    }

    public flag(): void {
        this._numFlags++;
        this._numFlags %= 4;
    }

    public reveal(): boolean {
        if (this._numMines > 0) {
            this._numFlags = this._numMines;
            return false;
        }
        this._isRevealed = true;
        return true;
    }

    public render(ctx: CanvasRenderingContext2D, renderer: Renderer): void {
        if (!this._isRevealed) {
            renderer.TILESET.drawTexture(ctx, 'tile_blueberry_covered');
            if (this._numFlags > 0) {
                renderer.TILESET.drawTexture(
                    ctx,
                    this._numFlags == 1
                        ? 'flag_1'
                        : this._numFlags == 2
                          ? 'flag_2'
                          : this._numFlags == 3
                            ? 'flag_3'
                            : 'null'
                );
            }
        } else {
            renderer.TILESET.drawTexture(ctx, 'tile_blueberry_uncovered');
            renderer.worldRenderer.renderNearbyNumberTile(ctx, this);
        }
    }

    public color(): number {
        return 0x2453a5;
    }

    public tileCoveredTexture(): keyof Renderer['TILESET']['textures'] {
        return 'tile_blueberry_covered';
    }

    public tileFinalFlagTexture(): keyof Renderer['TILESET']['textures'] {
        return 'flag_3';
    }

    public save(writer: BitWriter): void {
        if (this._numFlags == 0 && !this._isRevealed) {
            writer.write_bit(false);
            return;
        }
        writer.write_bit(true);
        writer.write_num(3, this._isRevealed ? 3 : this._numFlags - 1);
    }

    public load(reader: BitReader): void {
        if (!reader.read_bit()) {
            this._numFlags = 0;
            this._isRevealed = false;
            return;
        }
        const state = reader.read_num(3);
        if (state < 3) {
            this._numFlags = state + 1;
            this._isRevealed = false;
        } else {
            this._numFlags = 0;
            this._isRevealed = true;
        }
    }
}
