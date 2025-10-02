import type { Renderer } from './renderer';

export abstract class Tile {
    public readonly x: number;
    public readonly y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public abstract mineSearchPattern(): [number, number][];
    public abstract numMines(): number;

    public abstract isRevealed(): boolean;
    public abstract numFlags(): number;

    public abstract flag(): void;
    /** Returns true if revealed without dying */
    public abstract reveal(): boolean;

    /** Context is transformed so tile is at 0 0 with size 1 1 */
    public abstract render(ctx: CanvasRenderingContext2D, renderer: Renderer): void;
}

export const BASIC_PATTERN: [number, number][] = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1]
];

enum TileBasicSingularMineState {
    Covered,
    Revealed,
    Flagged
}

export abstract class TileBasicSingularMine extends Tile {
    private readonly _isMine: boolean;
    private _state: TileBasicSingularMineState = TileBasicSingularMineState.Covered;

    public constructor(x: number, y: number, isMine: boolean) {
        super(x, y);
        this._isMine = isMine;
    }

    public mineSearchPattern(): [number, number][] {
        return BASIC_PATTERN;
    }

    public numMines(): number {
        return this._isMine ? 1 : 0;
    }

    public numFlags(): number {
        return this._state === TileBasicSingularMineState.Flagged ? 1 : 0;
    }

    public isRevealed(): boolean {
        return this._state === TileBasicSingularMineState.Revealed;
    }

    public flag(): void {
        if (this._state === TileBasicSingularMineState.Covered) {
            this._state = TileBasicSingularMineState.Flagged;
        } else if (this._state === TileBasicSingularMineState.Flagged) {
            this._state = TileBasicSingularMineState.Covered;
        }
    }

    public reveal(): boolean {
        if (this._isMine) {
            this._state = TileBasicSingularMineState.Flagged;
            return false;
        }
        this._state = TileBasicSingularMineState.Revealed;
        return true;
    }

    public abstract getTileKey(
        renderer: Renderer,
        covered: boolean
    ): keyof Renderer['TILESET']['textures'];

    public render(ctx: CanvasRenderingContext2D, renderer: Renderer): void {
        switch (this._state) {
            case TileBasicSingularMineState.Covered:
                renderer.TILESET.drawTexture(ctx, this.getTileKey(renderer, true));
                break;
            case TileBasicSingularMineState.Revealed:
                renderer.TILESET.drawTexture(ctx, this.getTileKey(renderer, false));
                renderer.renderNearbyNumberTile(ctx, this);
                break;
            case TileBasicSingularMineState.Flagged:
                renderer.TILESET.drawTexture(ctx, this.getTileKey(renderer, true));
                renderer.TILESET.drawTexture(ctx, 'flag');
                break;
        }
    }
}
