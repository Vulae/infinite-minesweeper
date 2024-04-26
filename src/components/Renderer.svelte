<script lang="ts">
    import { resize } from "$lib/actions/Resize";
    import { WorldRenderer } from "$lib/game/Renderer";
    import type { World } from "$lib/game/World";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    const dispatcher = createEventDispatcher();

    export let world: World;
    let renderer: WorldRenderer;
    let canvas: HTMLCanvasElement;

    let firstCanvasResize: boolean = true;

    let needsRerender: boolean = false;
    let animFrame: number = -1;
    const render = () => {
        cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(render);
        if(needsRerender) {
            needsRerender = false;
            renderer.render();
        }
    }

    let keys: Set<string> = new Set();
    let keysInterval: number = -1;

    onMount(async () => {
        renderer = new WorldRenderer(world, canvas);

        // TODO: Clean Up!
        clearInterval(keysInterval);
        keysInterval = setInterval(() => {
            let change: boolean = false;

            if(keys.has('[')) {
                if(renderer.cameraZoom != renderer.cameraScale(1.04)) {
                    change = true;
                }
            }
            if(keys.has(']')) {
                if(renderer.cameraZoom != renderer.cameraScale(0.96)) {
                    change = true;
                }
            }
            if(keys.has('ArrowUp')) { renderer.cameraTranslate(0, 10); change = true; }
            if(keys.has('ArrowDown')) { renderer.cameraTranslate(0, -10); change = true; }
            if(keys.has('ArrowLeft')) { renderer.cameraTranslate(10, 0); change = true; }
            if(keys.has('ArrowRight')) { renderer.cameraTranslate(-10, 0); change = true; }

            if(keys.has('s')) {
                // DEBUG: Zoom to nearest power of 2, for a crisp screenshot.
                renderer.cameraZoom = Math.pow(2, Math.ceil(Math.log(renderer.cameraZoom) / Math.log(2)));
                renderer.cameraScale(1);
                change = true;
            }

            if(change) {
                needsRerender = true;
            }
        }, 1000 / 60);

        // FIXME: Why is this not always accurate.
        // Sometimes renderer.init() does not load theme fully before returning.
        await renderer.init();
        setTimeout(() => {
            render();
        }, 100);
    });

    onDestroy(() => {
        cancelAnimationFrame(animFrame);
        clearInterval(keysInterval);
    });

</script>

<svelte:window
    on:keydown={ev => {
        keys.add(ev.key);
    }}
    on:keyup={ev => {
        keys.delete(ev.key);
    }}
/>

<canvas
    class="w-full h-full cursor-pointer"
    bind:this={canvas}
    use:resize={(width, height) => {
        canvas.width = width;
        canvas.height = height;
        renderer.cameraScale(1);
        if(firstCanvasResize) {
            renderer.cameraTranslate(canvas.width / 2, canvas.height / 2);
            firstCanvasResize = false;
        }
        needsRerender = true;
    }}
    on:mousedown={ev => {
        if(document.pointerLockElement == canvas) return;
        if(ev.button == 1) {
            canvas.requestPointerLock();
            ev.preventDefault();
        } else if(ev.button == 0) {
            ev.preventDefault();
            const pos = renderer.cameraPos(ev.offsetX, ev.offsetY);
            dispatcher('action', { type: 'reveal', pos });
            needsRerender = true;
        } else if(ev.button == 2) {
            ev.preventDefault();
            const pos = renderer.cameraPos(ev.offsetX, ev.offsetY);
            dispatcher('action', { type: 'flag', pos });
            needsRerender = true;
        } else if(ev.button == 3) {
            // DEBUG: Reset tile
            ev.preventDefault();
            const pos = renderer.cameraPos(ev.offsetX, ev.offsetY);
            dispatcher('action', { type: 'reset', pos });
            needsRerender = true;
        }
    }}
    on:mouseup={ev => {
        if(document.pointerLockElement != canvas) return;
        if(ev.button != 1) return;
        document.exitPointerLock();
    }}
    on:mousemove={ev => {
        if(document.pointerLockElement != canvas) return;
        renderer.cameraTranslate(ev.movementX, ev.movementY);
        needsRerender = true;
    }}
    on:wheel|passive={ev => {
        const scale = ev.deltaY > 0 ? 0.9 : 1.1;
        if(renderer.cameraZoom != renderer.cameraScale(scale)) {
            needsRerender = true;
        }
    }}
    on:contextmenu={ev => {
        ev.preventDefault();
    }}
/>
