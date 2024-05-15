
import { World } from "./World";
import * as b from "$lib/BinType";
import { Viewport } from "./Viewport";
import type { Bookmark } from "$components/BookmarksModal.svelte";



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

function newSave(saveSlot: string, overwrite: boolean): Save {
    return { world: newWorld(saveSlot, true), bookmarks: [{
        name: 'Spawn',
        createdAt: new Date(),
        viewport: {
            x: 0,
            y: 0,
            zoom: 32
        }
    }] };
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

            if(save.viewport) {
                const viewport = new Viewport(world);
                viewport.cameraX = save.viewport.x;
                viewport.cameraY = save.viewport.y;
                viewport.cameraZoom = save.viewport.zoom;
                return { world, viewport, bookmarks: save.bookmarks };
            } else {
                return { world, bookmarks: save.bookmarks };
            }
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
                viewport: save.viewport ? {
                    x: save.viewport.cameraX,
                    y: save.viewport.cameraY,
                    zoom: save.viewport.cameraZoom
                } : null,
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

export const F_SAVE = b.modifyhash('v1.0.3', b.packed(b.object({
    world: F_WORLD,
    viewport: b.nullable(b.object({
        x: b.number('f64'),
        y: b.number('f64'),
        zoom: b.number('f64')
    })),
    bookmarks: b.array(b.object({
        name: b.string(),
        createdAt: b.date(),
        viewport: b.object({
            x: b.number('f64'),
            y: b.number('f64'),
            zoom: b.number('f64')
        })
    }))
}), true));



export interface Save {
    world: World;
    viewport?: Viewport;
    bookmarks?: Bookmark[];
}


