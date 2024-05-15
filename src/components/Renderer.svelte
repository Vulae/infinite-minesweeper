<script lang="ts">
    import { resize } from "$lib/actions/Resize";
    import { WorldRenderer } from "$lib/game/WorldRenderer";
    import { Viewport } from "$lib/game/Viewport";
    import type { World } from "$lib/game/World";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { ParticleRenderer } from "$lib/game/ParticleRenderer";
    import type { Theme } from "$lib/game/theme/Theme";
    import Controller from "./controller/Controller.svelte";
    const dispatcher = createEventDispatcher();

    export let world: World;
    export let theme: Theme;

    export let viewport: Viewport;

    // We separate world & particles to improve performance, not needing to render both at the same time.
    let worldRenderer: WorldRenderer;
    let worldCanvas: HTMLCanvasElement;

    let particleRenderer: ParticleRenderer;
    let particleCanvas: HTMLCanvasElement;

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

    onMount(async () => {
        worldRenderer = new WorldRenderer(world, theme, worldCanvas, viewport);
        particleRenderer = new ParticleRenderer(world, theme, particleCanvas, viewport);

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
    });

</script>

<div
    class="w-full h-full cursor-pointer"
    use:resize={(width, height) => {
        worldCanvas.width = width;
        worldCanvas.height = height;
        particleCanvas.width = width;
        particleCanvas.height = height;
        viewport.setSize(width, height);
        viewport.cameraScale(1);
        worldNeedsRerender = true;
        // Force early rerender to prevent rendered world to flash.
        render();
    }}
>
    <Controller
        class="w-full h-full force-overlap"
        on:move={ev => {
            viewport.cameraTranslate(ev.detail.dx, ev.detail.dy);
        }}
        on:zoom={ev => {
            viewport.cameraScale(ev.detail.amount, ev.detail.x / viewport.width, ev.detail.y / viewport.height);
        }}
        on:input={ev => {
            const pos = viewport.cameraPos(ev.detail.x, ev.detail.y);
            switch(ev.detail.type) {
                case 'primary': dispatcher('action', { type: 'reveal', pos }); break;
                case 'secondary': dispatcher('action', { type: 'flag', pos }); break;
                case 'extra': dispatcher('action', { type: 'reset', pos }); break;
            }
            worldNeedsRerender = true;
        }}
    >
        <canvas bind:this={worldCanvas} />
        <canvas bind:this={particleCanvas} />
    </Controller>
</div>
