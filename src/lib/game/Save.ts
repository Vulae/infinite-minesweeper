
import { World, type ChunkCoordinate } from "./World";
import * as bt from "bintype";
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
    console.log(viewport);
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

// @ts-ignore
export function load(saveSlot: string): Save {
    const str = localStorage.getItem(saveSlot);
    if(!str) {
        return newSave(saveSlot, true);
    } else {
        console.log('Loaded saved world');
        try {
            const save = F_SAVE.decode(str);
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
            localStorage.setItem(saveSlot, F_SAVE.encode({
                world: save.world.save(),
                viewport: save.viewport.save(),
                bookmarks: save.bookmarks ?? []
            }, { base64: true }));
            localStorage.removeItem('save_error');
        } catch(err) {
            localStorage.setItem('save_error', String(err));
        }
    }
}

export function clear(saveSlot: string): void {
    localStorage.removeItem(saveSlot);
}





export const F_CHUNK = bt.object({
    deaths: bt.array(bt.object({
        x: bt.number('u8'),
        y: bt.number('u8'),
        diedAt: bt.date()
    })),
    tiles: bt.binary()
});

class ChunkCoordinateParser extends bt.Parser<ChunkCoordinate> {
    public readonly magic = bt.hashStr('ChunkCoordinateParser');

    public encodeInternal(ctx: bt.EncodeContext, value: ChunkCoordinate): void {
        const [ _, chunkXstr, chunkYstr ] = value.match(/^(-?\d+),(-?\d+)$/)!;
        const [ chunkX, chunkY ] = [ parseInt(chunkXstr), parseInt(chunkYstr) ];
        ctx.encode(new bt.BigIntParser(true), BigInt(chunkX));
        ctx.encode(new bt.BigIntParser(true), BigInt(chunkY));
    }

    public decodeInternal(ctx: bt.DecodeContext): ChunkCoordinate {
        const chunkX = Number(ctx.decode(new bt.BigIntParser(true)));
        const chunkY = Number(ctx.decode(new bt.BigIntParser(true)));
        return `${chunkX},${chunkY}`;
    }
}

class ChunkCoordinateMapParser<T extends bt.Parser<any>> extends bt.Parser<Map<ChunkCoordinate, bt.ParserType<T>>> {
    public readonly magic: number;
    public readonly type: T;

    public constructor(type: T) {
        super();
        this.type = type;
        this.magic = bt.hashStr(`ChunkCoordinateMapParser:${this.type.magic}`);
    }

    public encodeInternal(ctx: bt.EncodeContext, map: Map<ChunkCoordinate, bt.ParserType<T>>): void {
        ctx.encode(new bt.BigIntParser(false), BigInt(map.size))
        for(const [ key, value ] of map.entries()) {
            ctx.encode(new ChunkCoordinateParser(), key);
            ctx.encode(this.type, value);
        }
    }

    public decodeInternal(ctx: bt.DecodeContext): Map<ChunkCoordinate, bt.ParserType<T>> {
        const map: Map<ChunkCoordinate, bt.ParserType<T>> = new Map();
        const size = Number(ctx.decode(new bt.BigIntParser(false)));
        for(let i = 0; i < size; i++) {
            const key = ctx.decode(new ChunkCoordinateParser());
            const value = ctx.decode(this.type);
            map.set(key, value);
        }
        return map;
    }
}

export const F_WORLD = bt.object({
    seed: bt.number('u32'),
    createdAt: bt.date(),
    numDeaths: bt.number('u32'),
    chunks: new ChunkCoordinateMapParser(F_CHUNK)
});

export const F_VIEWPORT = bt.object({
    x: bt.number('f64'),
    y: bt.number('f64'),
    scale: bt.number('f64')
});

export const F_SAVE = bt.modifyhash('v1.0.6', bt.object({
    world: F_WORLD,
    viewport: F_VIEWPORT,
    bookmarks: bt.array(bt.object({
        name: bt.string(),
        createdAt: bt.date(),
        viewport: F_VIEWPORT
    }))
}));



export interface Save {
    world: World;
    viewport: Viewport;
    bookmarks?: Bookmark[];
}


