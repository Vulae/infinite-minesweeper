
import { EventDispatcher } from "$lib/EventDispatcher";
import * as THREE from "three";
import type { ValidTile } from "../tile/Tile";
import type { World } from "../World";
import type { Viewport } from "../Viewport";



export abstract class Renderer extends EventDispatcher<{
    'resize': null;
    'before_render': Renderer;
    'after_render': Renderer;
    'tile_update': ValidTile;
}> {
    public readonly world: World;
    public readonly viewport: Viewport;

    public readonly canvas: HTMLCanvasElement;

    protected readonly renderer: THREE.WebGLRenderer;
    protected readonly scene: THREE.Scene;

    public constructor(world: World, viewport: Viewport, canvas: HTMLCanvasElement) {
        super();
        this.world = world;
        this.viewport = viewport;
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        // There's no lighting, so linear color space makes more sense.
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        this.scene = new THREE.Scene();

        this.setSize();
    }

    public setSize(): void {
        this.renderer.setSize(this.canvas.width, this.canvas.height);
    }

    public render(): void {
        this.dispatchEvent('before_render', this);

        const bounds = this.viewport.bounds(this.canvas, false, 0);
        const camera = new THREE.OrthographicCamera(bounds.minX, bounds.maxX, bounds.maxY, bounds.minY, 0.1, 100);

        this.renderer.render(this.scene, camera);

        this.dispatchEvent('after_render', this);
    }

    private animFrame: number = -1;
    private nextFrame(): void {
        cancelAnimationFrame(this.animFrame);
        if(!this.running) return;
        this.animFrame = requestAnimationFrame(() => this.nextFrame());
        this.render();
    }

    private _running: boolean = false;
    public get running(): boolean { return this._running; }
    public set running(running: boolean) {
        if(running == this._running) return;
        this._running = running;
        if(this._running) {
            this.nextFrame();
        } else {
            cancelAnimationFrame(this.animFrame);
        }
    }
    
    public async init(): Promise<void> {

    }
    
    public destroy(): void {
        this.running = false;
        this.destroyDispatcher();
    }

}


