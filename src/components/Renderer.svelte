<script lang="ts">
    import { resize } from "$lib/actions/Resize";
    import { WorldRenderer } from "$lib/game/WorldRenderer";
    import { Viewport } from "$lib/game/Viewport";
    import type { World } from "$lib/game/World";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { ParticleRenderer } from "$lib/game/ParticleRenderer";
    import type { Theme } from "$lib/game/theme/Theme";
    import Controller from "./controller/Controller.svelte";
    import type { EventListener } from "$lib/EventDispatcher";
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

    let worldListener: EventListener;
    let viewportListener: EventListener;

    onMount(async () => {
        worldRenderer = new WorldRenderer(world, theme, worldCanvas, viewport);
        particleRenderer = new ParticleRenderer(world, theme, particleCanvas, viewport);

        worldListener = world.addEventListener('change', () => {
            worldNeedsRerender = true;
        });
        viewportListener = viewport.addEventListener('change', () => {
            worldNeedsRerender = true;
        });

        // FIXME: Why is this not always accurate.
        // Sometimes renderer.init() does not load theme fully before returning.
        await worldRenderer.init();
        await particleRenderer.init();
        setTimeout(() => {
            worldNeedsRerender = true;
            render();
        }, 100);
    });

    onDestroy(() => {
        worldRenderer.destroy();
        particleRenderer.destroy();
        world.removeEventListener(worldListener);
        viewport.removeEventListener(viewportListener);
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
        // Force early rerender to prevent rendered world to flash.
        viewport.change();
        render();
    }}
>
    <Controller
        class="w-full h-full force-overlap"
        on:move={ev => {
            viewport.translate(worldCanvas, ev.detail.dx, ev.detail.dy);
            viewport.change();
        }}
        on:zoom={ev => {
            const newScale = ev.detail.amountType == 'relative' ? (viewport.scale * ev.detail.amount) : (viewport.scale + (ev.detail.amount - 1));
            const clampedScale = viewport.clampScale(worldCanvas, newScale, 0, 32);
            viewport.scaleFrom(worldCanvas, clampedScale, ev.detail.x, ev.detail.y);
            viewport.change();
        }}
        on:input={ev => {
            const pos = viewport.canvasPos(worldCanvas, ev.detail.x, ev.detail.y, true);
            switch(ev.detail.type) {
                case 'primary': dispatcher('action', { type: 'reveal', pos }); break;
                case 'secondary': dispatcher('action', { type: 'flag', pos }); break;
                case 'extra': dispatcher('action', { type: 'reset', pos }); break;
            }
            world.change();
        }}
    >
        <canvas bind:this={worldCanvas} />
        <canvas bind:this={particleCanvas} />
    </Controller>
</div>
