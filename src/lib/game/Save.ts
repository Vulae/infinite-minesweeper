
import { Base64 } from "js-base64";
import { World } from "./World";
import * as b from "$lib/BinType";



function newWorld(saveSlot: string, overwrite: boolean): World {
    console.log('Loaded new world');
    if(overwrite) {
        localStorage.setItem(saveSlot, 'PLACEHOLDER');
    }
    const world = new World(Math.floor(Math.random() * 0xFFFFFFFF));
    const closest0 = world.closest0(0, 0);
    world.reveal(closest0.x, closest0.y);
    return world;
}

export function load(saveSlot: string): World {
    const str = localStorage.getItem(saveSlot);
    if(!str) {
        return newWorld(saveSlot, true);
    } else {
        console.log('Loaded saved world');
        try {
            return World.load(F_SAVE.fromBase64(str));
        } catch(err) {
            console.error('Failed to load world.');
            console.error(err);

            return newWorld(saveSlot, false);
        }
    }
}

export function save(saveSlot: string, world: World): void {
    if(localStorage.getItem(saveSlot) !== null) {
        console.log('Save world');
        try {
            localStorage.setItem(saveSlot, F_SAVE.toBase64(world.save()));
            localStorage.removeItem('save_error');
        } catch(err) {
            localStorage.setItem('save_error', String(err));
        }
    }
}

export function clear(saveSlot: string): void {
    localStorage.removeItem(saveSlot);
}





export const F_CHUNK = b.object({
    deaths: b.array(b.object({
        x: b.number('u8'),
        y: b.number('u8'),
        diedAt: b.date()
    })),
    tiles: b.binary()
});

export const F_SAVE = b.packed(b.object({
    seed: b.number('u32'),
    createdAt: b.date(),
    numDeaths: b.number('u32'),
    chunks: b.record(b.string(), F_CHUNK)
}), true);


