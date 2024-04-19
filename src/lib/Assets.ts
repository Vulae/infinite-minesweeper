
import { TextureAtlas } from "./Atlas";



export const tileset = new TextureAtlas('/infinite-sweeper/tileset.png', {
    null: [ 0, 0, 16, 16 ],
    tile_covered: [ 16, 0, 16, 16 ],
    tile_revealed: [ 16, 16, 16, 16 ],
    bomb: [ 32, 0, 16, 16 ],
    explosion: [ 32, 16, 16, 16 ],
    flag: [ 32, 32, 16, 16 ],
    number_0: [ 48, 0, 16, 16 ],
    number_1: [ 48, 16, 16, 16 ],
    number_2: [ 48, 32, 16, 16 ],
    number_3: [ 48, 48, 16, 16 ],
    number_4: [ 48, 64, 16, 16 ],
    number_5: [ 48, 80, 16, 16 ],
    number_6: [ 48, 96, 16, 16 ],
    number_7: [ 48, 112, 16, 16 ],
    number_8: [ 48, 128, 16, 16 ]
});

export function tilesetNumberTexture(value: number) {
    switch(value) {
        case 0: return 'number_0';
        case 1: return 'number_1';
        case 2: return 'number_2';
        case 3: return 'number_3';
        case 4: return 'number_4';
        case 5: return 'number_5';
        case 6: return 'number_6';
        case 7: return 'number_7';
        case 8: return 'number_8';
        default: return 'null';
    }
}



