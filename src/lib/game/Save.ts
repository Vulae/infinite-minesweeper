
import { World } from "./World";
import * as b from "$lib/BinType";
import { Viewport } from "./Viewport";



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

export function load(saveSlot: string): { world: World, viewport?: Viewport } {
    const str = localStorage.getItem(saveSlot);
    if(!str) {
        return { world: newWorld(saveSlot, true) };
    } else {
        console.log('Loaded saved world');
        try {
            const save = F_SAVE.fromBase64(str);
            const world = World.load(save.world);

            if(save.viewport) {
                const viewport = new Viewport(world);
                // FIXME: Why is this extra logic needed?
                viewport.cameraX = save.viewport.x;
                viewport.cameraY = save.viewport.y;
                viewport.cameraZoom = save.viewport.zoom;
                return { world, viewport };
            } else {
                return { world };
            }
        } catch(err) {
            console.error('Failed to load world.');
            console.error(err);

            return { world: newWorld(saveSlot, false) };
        }
    }
}

export function save(saveSlot: string, world: World, viewport?: Viewport): void {
    if(localStorage.getItem(saveSlot) !== null) {
        console.log('Save world');
        try {
            localStorage.setItem(saveSlot, F_SAVE.toBase64({
                world: world.save(),
                viewport: viewport ? {
                    x: viewport.cameraX + viewport.cameraWidth() / 2,
                    y: viewport.cameraY + viewport.cameraHeight() / 2,
                    zoom: viewport.cameraZoom
                } : null
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

export const F_SAVE = b.modifyhash('v1.0.2', b.packed(b.object({
    world: F_WORLD,
    viewport: b.nullable(b.object({
        x: b.number('f64'),
        y: b.number('f64'),
        zoom: b.number('f64')
    }))
}), true));


