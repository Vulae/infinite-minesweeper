
import { Base64 } from "js-base64";
import { World } from "./World";



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
            return World.load(Base64.toUint8Array(str).buffer);
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
            localStorage.setItem(saveSlot, Base64.fromUint8Array(new Uint8Array(world.save())));
            localStorage.removeItem('save_error');
        } catch(err) {
            localStorage.setItem('save_error', String(err));
        }
    }
}

export function clear(saveSlot: string): void {
    localStorage.removeItem(saveSlot);
}


