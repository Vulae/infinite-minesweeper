<script lang="ts">
    import { resize } from "$lib/actions/Resize";
    import { Viewport } from "$lib/game/Viewport";
    import type { World } from "$lib/game/World";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import Controller from "./controller/Controller.svelte";
    import { inputMethod } from "../store";
    import { Renderer } from "$lib/game/renderer/Renderer";
    import { RetroRenderer } from "$lib/game/renderer/retro";
    import * as THREE from "three";
    import { type EventListener } from "$lib/EventDispatcher";
    const dispatcher = createEventDispatcher();

    let container: HTMLDivElement;

    export let theme: 'retro' = 'retro';
    export let world: World;
    export let viewport: Viewport;

    let canvas: HTMLCanvasElement;
    let camera: THREE.OrthographicCamera;
    let renderer: Renderer;

    let worldListener: EventListener;

    onMount(async () => {
        switch(theme) {
            case 'retro': {
                renderer = new RetroRenderer(world, viewport, canvas);
                break; }
        }

        camera = new THREE.OrthographicCamera();
        camera.up = new THREE.Vector3(0, 0, 1);
        renderer = new RetroRenderer(world, viewport, canvas);

        worldListener = world.addEventListener('tile_update', ({ data: tile }) => {
            renderer.dispatchEvent('tile_update', tile);
        });

        await renderer.init();
        renderer.running = true;
    });

    onDestroy(() => {
        renderer.running = false;
        world.removeEventListener(worldListener);
    });

</script>

<div
    bind:this={container}
    class="w-full h-full cursor-pointer force-overlap"
    use:resize={(width, height) => {
        canvas.width = width;
        canvas.height = height;
        viewport.change();
        renderer.setSize();
    }}
>
    <canvas bind:this={canvas} />
    <Controller
        class="w-full h-full force-overlap"
        inputMethod={$inputMethod}
        on:move={ev => {
            // FIXME: Why is Y inverted?
            viewport.translate(canvas, ev.detail.dx, -ev.detail.dy);
            viewport.change();
        }}
        on:zoom={ev => {
            // FIXME: Why is Y inverted?
            const newScale = ev.detail.amountType == 'relative' ? (viewport.scale * ev.detail.amount) : (viewport.scale + (ev.detail.amount - 1));
            const clampedScale = viewport.clampScale(canvas, newScale, 1, 48);
            viewport.scaleFrom(canvas, clampedScale, ev.detail.x, canvas.height - ev.detail.y);
            viewport.change();
        }}
        on:input={ev => {
            // FIXME: Why is Y inverted?
            let pos = viewport.canvasPos(canvas, ev.detail.x, canvas.height - ev.detail.y, true);
            switch(ev.detail.type) {
                case 'primary': dispatcher('action', { type: 'reveal', pos }); break;
                case 'secondary': dispatcher('action', { type: 'flag', pos }); break;
                case 'extra': dispatcher('action', { type: 'reset', pos }); break;
                // case 'extra': {
                //     viewport.scale = Math.pow(2, Math.ceil(Math.log(viewport.scale) / Math.log(2)));
                //     viewport.change();
                //     break; }
            }
            world.change();
        }}
    />
</div>
