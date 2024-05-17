
import { World } from "./World";
import * as b from "$lib/BinType";
import { Viewport } from "./Viewport";
import type { Bookmark } from "$components/BookmarksModal.svelte";



function newWorld(saveSlot: string, overwrite: boolean): { world: World, spawnX: number, spawnY: number } {
    console.log('Loaded new world');
    if(overwrite) {
        localStorage.setItem(saveSlot, 'PLACEHOLDER');
    }
    const world = new World(Math.floor(Math.random() * 0xFFFFFFFF));
    const closest0 = world.closest0(0, 0);
    world.reveal(closest0.x, closest0.y);
    return { world, spawnX: closest0.x, spawnY: closest0.y };
}

function newSave(saveSlot: string, overwrite: boolean): Save {
    const { world, spawnX, spawnY } = newWorld(saveSlot, overwrite);
    const viewport = new Viewport(world, { x: spawnX, y: spawnY, scale: 48 });
    return {
        world,
        viewport,
        bookmarks: [{
            name: 'Spawn',
            createdAt: new Date(),
            viewport: viewport.save()
        }]
    };
}

export function load(saveSlot: string): Save {
    const str = localStorage.getItem(saveSlot);
    if(!str) {
        return newSave(saveSlot, true);
    } else {
        console.log('Loaded saved world');
        try {
            const save = F_SAVE.fromBase64(str);
            const world = World.load(save.world);

            const viewport = new Viewport(world, save.viewport);
            return { world, viewport, bookmarks: save.bookmarks };
        } catch(err) {
            console.error('Failed to load world.');
            console.error(err);

            return newSave(saveSlot, false);
        }
    }
}

export function save(saveSlot: string, save: Save): void {
    if(localStorage.getItem(saveSlot) !== null) {
        console.log('Save world');
        try {
            localStorage.setItem(saveSlot, F_SAVE.toBase64({
                world: save.world.save(),
                viewport: save.viewport.save(),
                bookmarks: save.bookmarks ?? []
            }));
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

export const F_WORLD = b.object({
    seed: b.number('u32'),
    createdAt: b.date(),
    numDeaths: b.number('u32'),
    chunks: b.record(b.string(), F_CHUNK)
});

export const F_VIEWPORT = b.object({
    x: b.number('f64'),
    y: b.number('f64'),
    scale: b.number('f64')
});

export const F_SAVE = b.modifyhash('v1.0.5', b.packed(b.object({
    world: F_WORLD,
    viewport: F_VIEWPORT,
    bookmarks: b.array(b.object({
        name: b.string(),
        createdAt: b.date(),
        viewport: F_VIEWPORT
    }))
}), true));



export interface Save {
    world: World;
    viewport: Viewport;
    bookmarks?: Bookmark[];
}


