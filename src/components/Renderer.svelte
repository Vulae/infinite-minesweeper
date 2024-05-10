<script lang="ts">
    import { resize } from "$lib/actions/Resize";
    import { WorldRenderer } from "$lib/game/WorldRenderer";
    import { Viewport } from "$lib/game/Viewport";
    import type { World } from "$lib/game/World";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { ParticleRenderer } from "$lib/game/ParticleRenderer";
    import type { Theme } from "$lib/game/theme/Theme";
    const dispatcher = createEventDispatcher();

    let container: HTMLDivElement;

    export let world: World;
    export let theme: Theme;

    export let viewport: Viewport;

    // We separate world & particles to improve performance, not needing to render both at the same time.
    let worldRenderer: WorldRenderer;
    let worldCanvas: HTMLCanvasElement;

    let particleRenderer: ParticleRenderer;
    let particleCanvas: HTMLCanvasElement;

    let firstCanvasResize: boolean = true;

    let worldNeedsRerender: boolean = false;
    let animFrame: number = -1;
    const render = () => {
        cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(render);
        if(worldNeedsRerender) {
            worldNeedsRerender = false;
            worldRenderer.render();
        }
        particleRenderer.render();
    }

    let keys: Set<string> = new Set();
    let keysInterval: number = -1;

    onMount(async () => {
        worldRenderer = new WorldRenderer(world, theme, worldCanvas, viewport);
        particleRenderer = new ParticleRenderer(world, theme, particleCanvas, viewport);

        // TODO: Clean Up!
        clearInterval(keysInterval);
        keysInterval = setInterval(() => {
            if(keys.has('[')) {
                viewport.cameraScale(1.04);
            }
            if(keys.has(']')) {
                viewport.cameraScale(0.96);
            }
            if(keys.has('ArrowUp')) { viewport.cameraTranslate(0, 10); }
            if(keys.has('ArrowDown')) { viewport.cameraTranslate(0, -10); }
            if(keys.has('ArrowLeft')) { viewport.cameraTranslate(10, 0); }
            if(keys.has('ArrowRight')) { viewport.cameraTranslate(-10, 0); }

            if(keys.has('s')) {
                // DEBUG: Zoom to nearest power of 2, for a crisp screenshot.
                viewport.cameraZoom = Math.pow(2, Math.ceil(Math.log(viewport.cameraZoom) / Math.log(2)));
                viewport.cameraScale(1);
                viewport.change();
            }
        }, 1000 / 60);

        // FIXME: Why is this not always accurate.
        // Sometimes renderer.init() does not load theme fully before returning.
        await worldRenderer.init();
        await particleRenderer.init();
        setTimeout(() => {
            viewport.setSize(worldCanvas.width, worldCanvas.height);
            worldNeedsRerender = true;
            render();
        }, 100);

        viewport.addEventListener('change', () => {
            worldNeedsRerender = true;
        });
    });

    onDestroy(() => {
        worldRenderer.destroy();
        particleRenderer.destroy();
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

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="w-full h-full force-overlap cursor-pointer"
    bind:this={container}
    use:resize={(width, height) => {
        worldCanvas.width = width;
        worldCanvas.height = height;
        particleCanvas.width = width;
        particleCanvas.height = height;
        viewport.setSize(width, height);
        viewport.cameraScale(1);
        if(firstCanvasResize) {
            viewport.cameraTranslate(width / 2, height / 2);
            firstCanvasResize = false;
        }
        worldNeedsRerender = true;
    }}
    on:mousedown={ev => {
        if(document.pointerLockElement == container) return;
        if(ev.button == 1) {
            container.requestPointerLock();
            ev.preventDefault();
        } else if(ev.button == 0) {
            ev.preventDefault();
            const pos = viewport.cameraPos(ev.offsetX, ev.offsetY);
            dispatcher('action', { type: 'reveal', pos });
            worldNeedsRerender = true;
        } else if(ev.button == 2) {
            ev.preventDefault();
            const pos = viewport.cameraPos(ev.offsetX, ev.offsetY);
            dispatcher('action', { type: 'flag', pos });
            worldNeedsRerender = true;
        } else if(ev.button == 3) {
            // DEBUG: Reset tile
            ev.preventDefault();
            const pos = viewport.cameraPos(ev.offsetX, ev.offsetY);
            dispatcher('action', { type: 'reset', pos });
            worldNeedsRerender = true;
        }
    }}
    on:mouseup={ev => {
        if(document.pointerLockElement != container) return;
        if(ev.button != 1) return;
        document.exitPointerLock();
    }}
    on:mousemove={ev => {
        if(document.pointerLockElement != container) return;
        viewport.cameraTranslate(ev.movementX, ev.movementY);
    }}
    on:wheel|passive={ev => {
        const scale = ev.deltaY > 0 ? 0.9 : 1.1;
        if(viewport.cameraZoom != viewport.cameraScale(scale)) {
        }
    }}
    on:contextmenu={ev => {
        ev.preventDefault();
    }}
>
    <canvas bind:this={worldCanvas} />
    <canvas bind:this={particleCanvas} />
</div>
