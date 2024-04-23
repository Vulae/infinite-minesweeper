
import { World, type WorldSave } from "./World";



export function load(saveSlot: string): World {
    const str = localStorage.getItem(saveSlot);
    if(!str) {
        console.log('Loaded new world');
        localStorage.setItem(saveSlot, 'PLACEHOLDER');
        const world = new World(Math.floor(Math.random() * 0xFFFFFFFF));
        const closest0 = world.closest0(0, 0);
        world.reveal(closest0.x, closest0.y);
        return world;
    } else {
        console.log('Loaded saved world');
        const save: WorldSave = JSON.parse(str);
        return World.load(save);
    }
}

export function save(saveSlot: string, world: World): void {
    if(localStorage.getItem(saveSlot) !== null) {
        console.log('Save world');
        localStorage.setItem(saveSlot, JSON.stringify(world.save()));
    }
}

export function clear(saveSlot: string): void {
    localStorage.removeItem(saveSlot);
}


