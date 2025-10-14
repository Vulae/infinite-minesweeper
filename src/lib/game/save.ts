import { GIT_VERSION } from '$lib/GIT_VERSION';
import { DataReader, DataWriter } from '$lib/io';
import Pako from 'pako';
import type { Game } from './game';
import { World } from './world';
import { Base64 } from 'js-base64';

// Save format:
//     String - Game version (From /src/lib/GIT_VERSION.ts)
//     Int - World seed
//     Int - Num deaths
//     Death[] - Deaths
//         Int - X
//         Int - Y
//     Int - Num chunks
//     Chunk[] - Chunks
//         Int - ChunkX
//         Int - ChunkY
//         Int - Bitstream byte size
//         Byte[] - Chunk data bitstream
//
// The final output is compressed with deflate compression.
// And if stored in localstorage it is also base64 encoded.

const DEFAULT_SLOT: string = 'unnamed_slot';

const __DEBUG_SKIP_GIT_CHECK: boolean = false;
const __DEBUG_GIT_CHECK_SKIP_STR: string = 'DEBUG_SKIP_GIT_CHECK';

function slotName(slot: string): string {
    return `infinite-minesweeper-save_${slot}`;
}

export class SaveManager {
    private readonly game: Game;

    public readonly slot: string;

    public constructor(game: Game, slot: string = DEFAULT_SLOT) {
        this.game = game;
        this.slot = slot;
    }

    private saveRaw(): ArrayBuffer {
        const writer = new DataWriter();

        writer.write_string(GIT_VERSION ?? __DEBUG_GIT_CHECK_SKIP_STR);

        this.game.world.save(writer);

        return writer.final();
    }

    public save(): void {
        if (!__DEBUG_SKIP_GIT_CHECK) {
            if (GIT_VERSION === null) {
                console.info(`Cannot save, saving & loading is disabled.`);
                return;
            }
        }

        console.info(`Saving world to slot "${this.slot}"`);

        const raw = this.saveRaw();
        const compressed = Pako.deflate(raw);
        const encoded = Base64.fromUint8Array(compressed);

        localStorage.setItem(slotName(this.slot), encoded);
    }

    private static loadRaw(raw: ArrayBuffer): World {
        const reader = new DataReader(raw);

        const version = reader.read_string();

        if (
            !__DEBUG_SKIP_GIT_CHECK ? version != GIT_VERSION : version != __DEBUG_GIT_CHECK_SKIP_STR
        ) {
            console.error(
                `Git version string mismatch, Expected: "${__DEBUG_SKIP_GIT_CHECK ? __DEBUG_GIT_CHECK_SKIP_STR : GIT_VERSION}" but got "${version}"\nReturning new world instead.`
            );
            return World.new();
        }

        return World.load(reader);
    }

    public static load(slot: string = DEFAULT_SLOT): World {
        if (!__DEBUG_SKIP_GIT_CHECK) {
            if (GIT_VERSION === null) {
                console.info(`Cannot load, saving & loading is disabled.`);
                return World.new();
            }
        }

        const saveStr = localStorage.getItem(slotName(slot));

        if (!saveStr) {
            console.info(`No save for slot "${slot}", creating new world.`);
            return World.new();
        }

        console.info(`Save for slot "${slot}" loading world.`);

        const compressed = Base64.toUint8Array(saveStr);
        const decompressed = Pako.inflate(compressed);
        return SaveManager.loadRaw(decompressed.buffer);
    }
}
