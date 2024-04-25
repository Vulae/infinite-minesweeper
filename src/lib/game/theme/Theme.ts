
import type { ValidTile } from "../tile/Tile";



export abstract class Theme {
    public abstract init(): Promise<void>;
    public abstract drawTile(ctx: CanvasRenderingContext2D, tile: ValidTile): void;
}


