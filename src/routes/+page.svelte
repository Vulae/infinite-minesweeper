<script lang="ts">
    import { WorldRNG } from "$lib/RNG";
    import { WorldRenderer } from "$lib/Renderer";
    import { World } from "$lib/World";
    import { resize } from "$lib/actions/Resize";
    import { onDestroy, onMount } from "svelte";

    let canvas: HTMLCanvasElement;
    let world: World;
    let renderer: WorldRenderer;

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

    onMount(() => {
        world = new World(new WorldRNG(0));
        world.revealClosest0(0, 0);
        renderer = new WorldRenderer(world, canvas);
        console.log(world);
        render();
    });

    onDestroy(() => {
        try {
            location.reload();
        } catch(err) { }
    });
</script>

<canvas
    class="w-screen h-screen"
    bind:this={canvas}
    use:resize={(width, height) => {
        canvas.width = width;
        canvas.height = height;
        renderer.cameraScale(1);
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
            world.reveal(pos.x, pos.y);
            needsRerender = true;
        } else if(ev.button == 2) {
            ev.preventDefault();
            const pos = renderer.cameraPos(ev.offsetX, ev.offsetY);
            world.flag(pos.x, pos.y);
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
        renderer.cameraScale(ev.deltaY > 0 ? 0.9 : 1.1);
        needsRerender = true;
    }}
    on:contextmenu={ev => {
        ev.preventDefault();
    }}
/>
