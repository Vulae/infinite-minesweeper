import type { BitReader, BitWriter } from '$lib/io';
import type { Renderer } from './renderer/renderer';
import { NEARBY_NONE, type World } from './world';

function nearbyCounter(
    world: World,
    tile: Tile,
    counter: (neighbor: Tile) => number
): number | typeof NEARBY_NONE {
    let nearbyCount = 0;
    let hasNearby: boolean = false;
    for (const neighbor of world.iterPattern(tile.x, tile.y, tile.mineSearchPattern())) {
        const count = counter(neighbor);
        if (count != 0) {
            hasNearby = true;
        }
        nearbyCount += count;
    }
    if (hasNearby) {
        return nearbyCount;
    } else {
        return NEARBY_NONE;
    }
}

export abstract class Tile {
    public readonly x: number;
    public readonly y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    private getNearbyMinesCache: number | typeof NEARBY_NONE | null = null;
    public getNearbyMines(world: World): number | typeof NEARBY_NONE {
        if (this.getNearbyMinesCache === null) {
            this.getNearbyMinesCache = nearbyCounter(world, this, (neighbor) =>
                neighbor.numMines()
            );
        }
        return this.getNearbyMinesCache;
    }

    public getNearbyFlags(world: World): number | typeof NEARBY_NONE {
        return nearbyCounter(world, this, (neighbor) => neighbor.numFlags());
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
    /**
     * Returns a color of this tile for lowres rendering mode
     * @returns 0xRRGGBB
     */
    public abstract color(): number;
    /**
     * @returns This tile's covered texture
     */
    public abstract tileCoveredTexture(): keyof Renderer['TILESET']['textures'];
    /**
     * @returns This tile's final flag texture
     */
    public abstract tileFinalFlagTexture(): keyof Renderer['TILESET']['textures'];

    public abstract save(writer: BitWriter): void;
    public abstract load(reader: BitReader): void;
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
                renderer.worldRenderer.renderNearbyNumberTile(ctx, this);
                break;
            case TileBasicSingularMineState.Flagged:
                renderer.TILESET.drawTexture(ctx, this.getTileKey(renderer, true));
                renderer.TILESET.drawTexture(ctx, 'flag');
                break;
        }
    }

    public tileFinalFlagTexture(): keyof Renderer['TILESET']['textures'] {
        return 'flag';
    }

    public save(writer: BitWriter): void {
        switch (this._state) {
            case TileBasicSingularMineState.Covered: {
                writer.write_bit(false);
                break;
            }
            case TileBasicSingularMineState.Flagged: {
                writer.write_bit(true);
                writer.write_bit(true);
                break;
            }
            case TileBasicSingularMineState.Revealed: {
                writer.write_bit(true);
                writer.write_bit(false);
                break;
            }
        }
    }

    public load(reader: BitReader): void {
        if (!reader.read_bit()) {
            this._state = TileBasicSingularMineState.Covered;
        } else {
            if (reader.read_bit()) {
                this._state = TileBasicSingularMineState.Flagged;
            } else {
                this._state = TileBasicSingularMineState.Revealed;
            }
        }
    }
}
