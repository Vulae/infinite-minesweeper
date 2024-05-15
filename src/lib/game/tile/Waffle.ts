
import type { BitIO } from "$lib/BitIO";
import type { World } from "../World";
import { SingleMineTile } from "./SingleMine";
import { hashNormal } from "$lib/RNG";
import type { ValidTile } from "./Tile";



export function waffleIsDark(checkerSize: number, x: number, y: number): boolean {
    const checkerX = Math.floor(x / checkerSize);
    const checkerY = Math.floor(y / checkerSize);
    return (checkerX + checkerY % 2) % 2 == 0;
}

export function waffle(world: World, checkerSize: number, x: number, y: number): { isDark: boolean, isMine: boolean } {
    const checkerX = Math.floor(x / checkerSize);
    const checkerY = Math.floor(y / checkerSize);
    const isDark = (checkerX + checkerY % 2) % 2 == 0;

    const checkerIndex = Math.abs(x % checkerSize) + Math.abs(y % checkerSize) * checkerSize;
    const checkerRngPos = Math.floor(hashNormal(world.tileSeed, checkerX, checkerY, 0) * checkerSize**2);
    
    const isMine = (isDark ? (
        checkerIndex == checkerRngPos ? false : true
    ) : (
        checkerIndex == checkerRngPos ? true : false
    ));

    return { isDark, isMine };
}



export class WaffleTile extends SingleMineTile {
    public readonly type: 'waffle' = 'waffle';

    public readonly isDark: boolean;

    public constructor(world: World, x: number, y: number) {
        const { isDark, isMine } = waffle(world, 2, x, y);
        super(world, x, y, isMine);
        this.isDark = isDark
    }
    
    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(new WaffleTile(world, x, y), io);
    }
}


