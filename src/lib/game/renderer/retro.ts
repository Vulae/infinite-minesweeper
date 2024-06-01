
import { Renderer } from "./Renderer";
import * as THREE from "three";
import { BufferGeometryUtils } from "three/addons";
import { TextureAtlas } from "$lib/Atlas";
import { RENDERER_TILES_CREATE_MARGIN, RENDERER_TILES_MESH_SIZE, RENDERER_TILES_REMOVE_MARGIN } from "../Constants";
import { TILE_NONE_NEARBY, type ValidTile } from "../tile/Tile";
import { SingleMineTileState, type SingleMineTile } from "../tile/SingleMine";
import type { MultiMineTile } from "../tile/MultiMine";
import { StrawberryTileSecondaryMines, type StrawberryTile } from "../tile/biome/Strawberry";
import { SingleAntiMineTileState, type SingleAntiMineTile } from "../tile/SingleAntiMine";



// TODO: Have 2 separate meshes for TilesMesh: Base (Always opaque) & Overlay.
// For faster rendering by not having 1 mesh that is always transparent.

// TODO: Maybe move mesh creation to a webworker?



interface TilesMesh {
    x: number;
    y: number;
    mesh: THREE.Mesh;
}

type GenMeshItem<T extends string> = {
    texture: T;
    left: number;
    right: number;
    top: number;
    bottom: number;
} | T;

function lerp(start: number, end: number, t: number): number {
    return start + t * (end - start);
}

function transformGenMeshItems<T extends string>(textures: GenMeshItem<T>[], left: number, right: number, top: number, bottom: number): GenMeshItem<T>[] {
    return textures.map(t => (typeof t == 'string' ? {
        texture: t, left, right, top, bottom
    } : {
        texture: t.texture,
        left: lerp(left, right, t.left),
        right: lerp(left, right, t.right),
        top: lerp(top, bottom, t.top),
        bottom: lerp(top, bottom, t.bottom)
    }));
}

export class RetroRenderer extends Renderer {

    private atlas = new TextureAtlas('/infinite-minesweeper/retro/tileset.png', {
        null: [ 0, 0, 16, 16 ],
        skull: [ 0, 16, 16, 16 ],
        bomb: [ 16, 0, 16, 16 ],
        explosion1: [ 16, 16, 16, 16 ],
        explosion2: [ 16, 32, 16, 16 ],
        explosion3: [ 16, 48, 16, 16 ],
        explosion4: [ 16, 64, 16, 16 ],
        flag: [ 32, 16, 16, 16 ],
        flag_1: [ 32, 48, 16, 16 ],
        flag_2: [ 32, 64, 16, 16 ],
        flag_3: [ 32, 80, 16, 16 ],
        flag_anti: [ 32, 32, 16, 16 ],
        flag_anti_1: [ 32, 96, 16, 16 ],
        flag_anti_2: [ 32, 112, 16, 16 ],
        flag_anti_3: [ 32, 128, 16, 16 ],
        number_0: [ 48, 0, 16, 16 ],
        number_1: [ 48, 16, 16, 16 ],
        number_2: [ 48, 32, 16, 16 ],
        number_3: [ 48, 48, 16, 16 ],
        number_4: [ 48, 64, 16, 16 ],
        number_5: [ 48, 80, 16, 16 ],
        number_6: [ 48, 96, 16, 16 ],
        number_7: [ 48, 112, 16, 16 ],
        number_8: [ 48, 128, 16, 16 ],
        number_9: [ 48, 144, 16, 16 ],
        number_10: [ 48, 160, 16, 16 ],
        number_11: [ 48, 176, 16, 16 ],
        number_12: [ 48, 192, 16, 16 ],
        number_13: [ 48, 208, 16, 16 ],
        number_14: [ 48, 224, 16, 16 ],
        number_15: [ 48, 240, 16, 16 ],
        number_16: [ 48, 256, 16, 16 ],
        number_17: [ 48, 272, 16, 16 ],
        number_18: [ 48, 288, 16, 16 ],
        number_19: [ 48, 304, 16, 16 ],
        number_20: [ 48, 320, 16, 16 ],
        number_21: [ 48, 336, 16, 16 ],
        number_22: [ 48, 352, 16, 16 ],
        number_23: [ 48, 368, 16, 16 ],
        number_24: [ 48, 384, 16, 16 ],
        number_negative_sign: [ 96, 96, 16, 16 ],
        tile_vanilla_covered: [ 64, 0, 16, 16 ],
        tile_vanilla_revealed: [ 80, 0, 16, 16 ],
        tile_chocolate_covered: [ 64, 16, 16, 16 ],
        tile_chocolate_revealed: [ 80, 16, 16, 16 ],
        tile_waffle_light_covered: [ 64, 32, 16, 16 ],
        tile_waffle_light_revealed: [ 80, 32, 16, 16 ],
        tile_waffle_dark_covered: [ 96, 32, 16, 16 ],
        tile_waffle_dark_revealed: [ 112, 32, 16, 16 ],
        tile_stroopwafel_light_covered: [ 64, 48, 16, 16 ],
        tile_stroopwafel_light_revealed: [ 80, 48, 16, 16 ],
        tile_stroopwafel_dark_covered: [ 96, 48, 16, 16 ],
        tile_stroopwafel_dark_revealed: [ 112, 48, 16, 16 ],
        tile_blueberry_covered: [ 64, 64, 16, 16 ],
        tile_blueberry_revealed: [ 80, 64, 16, 16 ],
        tile_strawberry_covered: [ 64, 80, 16, 16 ],
        tile_strawberry_revealed: [ 80, 80, 16, 16 ],
        tile_cookies_and_cream_covered: [ 64, 96, 16, 16 ],
        tile_cookies_and_cream_revealed: [ 80, 96, 16, 16 ],
    });
    private atlasTexture?: THREE.Texture;
    private atlasMaterial?: THREE.Material;

    private mergeTextures(x: number, y: number, textures: GenMeshItem<keyof typeof this.atlas.textures>[]): THREE.BufferGeometry {
        let geoms: THREE.BufferGeometry[] = [];
        let z = -10 - (textures.length);
        for(const texture of textures) {
            const texName = typeof texture == 'string' ? texture : texture.texture;
            const left = typeof texture == 'string' ? 0 : texture.left;
            const right = typeof texture == 'string' ? 1 : texture.right;
            const top = typeof texture == 'string' ? 0 : texture.top;
            const bottom = typeof texture == 'string' ? 1 : texture.bottom;

            const geom = new THREE.BufferGeometry();
            geom.setIndex([
                0, 1, 2,
                2, 3, 0
            ]);
            geom.setAttribute('position', new THREE.Float32BufferAttribute([
                left + x, top + y, z,
                right + x, top + y, z,
                right + x, bottom + y, z,
                left + x, bottom + y, z
            ], 3));
            const { uMin, uMax, vMin, vMax } = this.atlas.uvs(texName);
            geom.setAttribute('uv', new THREE.Float32BufferAttribute([
                uMin, vMin,
                uMax, vMin,
                uMax, vMax,
                uMin, vMax
            ], 2, true));
            geoms.push(geom);
            z++;
        }
        return BufferGeometryUtils.mergeGeometries(geoms);
    }

    private nearbyTileCountTexture(count: number | TILE_NONE_NEARBY): GenMeshItem<keyof typeof this.atlas.textures>[] {
        if(count == TILE_NONE_NEARBY) return [];
        if(count < 0) {
            const tex = this.nearbyTileCountTexture(-count);
            return [{
                texture: 'number_negative_sign',
                left: 0,
                right: 0.55,
                top: 0.25 - 0.025,
                bottom: 0.75 + 0.025
            }, ...transformGenMeshItems(tex, 0.45, 1, 0.25 - 0.025, 0.75 + 0.025)];
        }
        switch(count) {
            case 0: return [ 'number_0' ];
            case 1: return [ 'number_1' ];
            case 2: return [ 'number_2' ];
            case 3: return [ 'number_3' ];
            case 4: return [ 'number_4' ];
            case 5: return [ 'number_5' ];
            case 6: return [ 'number_6' ];
            case 7: return [ 'number_7' ];
            case 8: return [ 'number_8' ];
            case 9: return [ 'number_9' ];
            case 10: return [ 'number_10' ];
            case 11: return [ 'number_11' ];
            case 12: return [ 'number_12' ];
            case 13: return [ 'number_13' ];
            case 14: return [ 'number_14' ];
            case 15: return [ 'number_15' ];
            case 16: return [ 'number_16' ];
            case 17: return [ 'number_17' ];
            case 18: return [ 'number_18' ];
            case 19: return [ 'number_19' ];
            case 20: return [ 'number_20' ];
            case 21: return [ 'number_21' ];
            case 22: return [ 'number_22' ];
            case 23: return [ 'number_23' ];
            case 24: return [ 'number_24' ];
        }
        return [ 'null' ];
    }

    private flagsTileTexture(count: number): GenMeshItem<keyof typeof this.atlas.textures>[] {
        switch(count) {
            case 0: return [ ];
            case 1: return [ 'flag_1' ];
            case 2: return [ 'flag_2' ];
            case 3: return [ 'flag_3' ];
            case -1: return  [ 'flag_anti_1' ];
            case -2: return  [ 'flag_anti_2' ];
            case -3: return  [ 'flag_anti_3' ];
        }
        return [ 'null' ];
    }

    private singleMineTileTextureStack(tile: SingleMineTile, covered: keyof typeof this.atlas.textures, revealed: keyof typeof this.atlas.textures): GenMeshItem<keyof typeof this.atlas.textures>[] {
        switch(tile.state) {
            case SingleMineTileState.Covered: return [ covered ];
            case SingleMineTileState.Flagged: return [ covered, 'flag' ];
            case SingleMineTileState.Revealed: return [ revealed, ...this.nearbyTileCountTexture(tile.minesNearby(true)) ];
        }
    }

    private multiMineTileTextureStack(tile: MultiMineTile, covered: keyof typeof this.atlas.textures, revealed: keyof typeof this.atlas.textures): GenMeshItem<keyof typeof this.atlas.textures>[] {
        if(!tile.isRevealed) {
            return [ covered, ...this.flagsTileTexture(tile.numFlags()) ];
        } else {
            return [ revealed, ...this.nearbyTileCountTexture(tile.minesNearby()) ];
        }
    }

    private strawberryTileTextureStack(tile: StrawberryTile): GenMeshItem<keyof typeof this.atlas.textures>[] {
        switch(tile.state) {
            case SingleMineTileState.Covered: return [ 'tile_strawberry_covered' ];
            case SingleMineTileState.Flagged: return [ 'tile_strawberry_covered', 'flag' ];
            case SingleMineTileState.Revealed: {
                const nearby1 = tile.minesNearby(true);
                const nearby2 = tile.secondaryMinesNearby(true);
                if(nearby2 == null) {
                    return [ 'tile_strawberry_revealed', ...this.nearbyTileCountTexture(nearby1) ];
                } else {
                    let newNearby1 = tile.secondaryNearbyMines == StrawberryTileSecondaryMines.Right ? nearby1 : nearby2;
                    let newNearby2 = tile.secondaryNearbyMines == StrawberryTileSecondaryMines.Right ? nearby2 : nearby1;
                    return [
                        'tile_strawberry_revealed',
                        ...transformGenMeshItems(this.nearbyTileCountTexture(newNearby1), 0, 0.55, 0.25 - 0.025, 0.75 + 0.025),
                        ...transformGenMeshItems(this.nearbyTileCountTexture(newNearby2), 0.45, 1, 0.25 - 0.025, 0.75 + 0.025),
                    ];
                }
                break; }
        }
    }

    private singleAntiMineTileTextureStack(tile: SingleAntiMineTile, covered: keyof typeof this.atlas.textures, revealed: keyof typeof this.atlas.textures): GenMeshItem<keyof typeof this.atlas.textures>[] {
        switch(tile.state) {
            case SingleAntiMineTileState.Covered: return [ covered ];
            case SingleAntiMineTileState.Flagged: return [ covered, 'flag' ];
            case SingleAntiMineTileState.AntiFlagged: return [ covered, 'flag_anti' ];
            case SingleAntiMineTileState.Revealed: return [ revealed, ...this.nearbyTileCountTexture(tile.minesNearby(true)) ];
        }
    }

    private tileTextureStack(tile: ValidTile): GenMeshItem<keyof typeof this.atlas.textures>[] {
        switch(tile.type) {
            case 'vanilla': return this.singleMineTileTextureStack(tile, 'tile_vanilla_covered', 'tile_vanilla_revealed');
            case 'chocolate': return this.singleMineTileTextureStack(tile, 'tile_chocolate_covered', 'tile_chocolate_revealed');
            case 'waffle': return this.singleMineTileTextureStack(tile, tile.isDark ? 'tile_waffle_dark_covered' : 'tile_waffle_light_covered', tile.isDark ? 'tile_waffle_dark_revealed' : 'tile_waffle_light_revealed');
            case 'stroopwafel': return this.singleMineTileTextureStack(tile, tile.isDark ? 'tile_stroopwafel_dark_covered' : 'tile_stroopwafel_light_covered', tile.isDark ? 'tile_stroopwafel_dark_revealed' : 'tile_stroopwafel_light_revealed');
            case 'blueberry': return this.multiMineTileTextureStack(tile, 'tile_blueberry_covered', 'tile_blueberry_revealed');
            case 'strawberry': return this.strawberryTileTextureStack(tile);
            case 'cookies_and_cream': return this.singleAntiMineTileTextureStack(tile, 'tile_cookies_and_cream_covered', 'tile_cookies_and_cream_revealed');
        }
        return [ 'null' ];
    }

    private tilesMeshes: TilesMesh[] = [];
    private hasTilesMesh(x: number, y: number): boolean {
        return this.tilesMeshes.some(tilesMesh => tilesMesh.x == x && tilesMesh.y == y);
    }
    private removeTilesMesh(x: number, y: number): void {
        for(let i = 0; i < this.tilesMeshes.length; i++) {
            const tilesMesh = this.tilesMeshes[i];
            if(tilesMesh.x == x && tilesMesh.y == y) {
                this.tilesMeshes.splice(i--, 1);
                tilesMesh.mesh.removeFromParent();
            }
        }
    }
    private createTilesMesh(x: number, y: number): void {
        this.removeTilesMesh(x, y);

        let geoms: THREE.BufferGeometry[] = [];
        for(let dx = 0; dx < RENDERER_TILES_MESH_SIZE; dx++) {
            for(let dy = 0; dy < RENDERER_TILES_MESH_SIZE; dy++) {
                const tile = this.world.getTile(x + dx, y + dy);
                const stack = this.tileTextureStack(tile);
                if(tile.isDeathTile()) {
                    stack.push('skull');
                }
                if(stack.length == 0) continue;
                const geom = this.mergeTextures(dx, dy, stack);
                geoms.push(geom);
            }
        }
        const merged = BufferGeometryUtils.mergeGeometries(geoms);

        const mesh = new THREE.Mesh(merged, this.atlasMaterial!);
        mesh.translateX(x);
        mesh.translateY(y);

        this.scene.add(mesh);

        this.tilesMeshes.push({ x, y, mesh });
    }

    public async init(): Promise<void> {
        await super.init();

        await this.atlas.awaitLoad();
        // Repack tileset (To prevent texture bleeding)
        this.atlas = this.atlas.toImageDataAtlas().toImageAtlas(true);
        this.atlasTexture = new THREE.CanvasTexture(this.atlas.img);
        this.atlasTexture.generateMipmaps = false;
        this.atlasTexture.magFilter = THREE.NearestFilter;
        this.atlasTexture.minFilter = THREE.NearestFilter;

        this.atlasMaterial = new THREE.MeshBasicMaterial({
            map: this.atlasTexture,
            transparent: true
        });

        this.addEventListener('tile_update', ({ data: tile }) => {
            const tx = Math.floor(tile.x / RENDERER_TILES_MESH_SIZE) * RENDERER_TILES_MESH_SIZE;
            const ty = Math.floor(tile.y / RENDERER_TILES_MESH_SIZE) * RENDERER_TILES_MESH_SIZE;
            this.removeTilesMesh(tx, ty);
        });

        this.addEventListener('before_render', () => {
            // Remove meshes outside viewport.
            for(let i = 0; i < this.tilesMeshes.length; i++) {
                const tilesMesh = this.tilesMeshes[i];
                if(this.viewport.intersects(tilesMesh.x, tilesMesh.y, RENDERER_TILES_MESH_SIZE, RENDERER_TILES_MESH_SIZE, this.canvas, true, RENDERER_TILES_REMOVE_MARGIN)) continue;
                this.tilesMeshes.splice(i--, 1);
                tilesMesh.mesh.removeFromParent();
            }

            // Generate meshes inside viewport.
            const { minX, maxX, minY, maxY } = this.viewport.bounds(this.canvas, true, 0);
            for(let tx = Math.floor(minX / RENDERER_TILES_MESH_SIZE) * RENDERER_TILES_MESH_SIZE; tx <= Math.ceil(maxX / RENDERER_TILES_MESH_SIZE) * RENDERER_TILES_MESH_SIZE; tx += RENDERER_TILES_MESH_SIZE) {
                for(let ty = Math.floor(minY / RENDERER_TILES_MESH_SIZE) * RENDERER_TILES_MESH_SIZE; ty <= Math.ceil(maxY / RENDERER_TILES_MESH_SIZE) * RENDERER_TILES_MESH_SIZE; ty += RENDERER_TILES_MESH_SIZE) {
                    if(!this.viewport.intersects(tx, ty, RENDERER_TILES_MESH_SIZE, RENDERER_TILES_MESH_SIZE, this.canvas, true, RENDERER_TILES_CREATE_MARGIN)) continue;
                    if(this.hasTilesMesh(tx, ty)) continue;
                    this.createTilesMesh(tx, ty);
                }
            }
        });
    }

}


