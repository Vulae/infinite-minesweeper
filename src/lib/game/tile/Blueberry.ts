
import type { BitIO } from "$lib/BitIO";
import { sfc_hash } from "$lib/RNG";
import type { World } from "../World";
import { MultiMineTile } from "./MultiMine";
import type { ValidTile } from "./Tile";



const mineIndices: number[] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1,
    2, 2,
    3
];



export class BlueberryTile extends MultiMineTile {
    public readonly type: 'blueberry' = 'blueberry';

    public readonly numMaxMines: number = 3;

    public constructor(world: World, x: number, y: number) {
        const numMines = mineIndices[Math.floor(sfc_hash(world.tileSeed, x, y, 1) * mineIndices.length)];
        super(world, x, y, numMines);
    }

    public static load(world: World, x: number, y: number, io: BitIO): ValidTile {
        return this.loadInternal(new BlueberryTile(world, x, y), io);
    }
}


