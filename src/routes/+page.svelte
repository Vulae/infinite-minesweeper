<script lang="ts">
    import { WorldRNG } from "$lib/RNG";
    import { WorldRenderer } from "$lib/Renderer";
    import { World } from "$lib/World";
    import { resize } from "$lib/actions/Resize";
    import { onDestroy, onMount } from "svelte";
    import { tileset } from "$lib/Assets";

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

    let selTile: { x: number, y: number } | null = null;

    onMount(() => {
        const seed = parseInt(new URL(location.href).searchParams.get('seed') ?? '0');
        world = new World(new WorldRNG(seed));
        const closest0 = world.closest0(0, 0);
        world.reveal(closest0.x, closest0.y);
        renderer = new WorldRenderer(world, canvas);
        setTimeout(() => {
            renderer.cameraTranslate(canvas.width / 2, canvas.height / 2);
            needsRerender = true;
        }, 100);
        tileset.onLoad(() => {
            needsRerender = true;
        });
        console.log(world);
        render();
    });

    onDestroy(() => {
        try {
            location.reload();
        } catch(err) { }
    });
</script>

<div class="w-screen h-screen grid grid-cols-1 grid-rows-1">
    <canvas
        class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1"
        bind:this={canvas}
        use:resize={(width, height) => {
            canvas.width = width;
            canvas.height = height;
            renderer.cameraScale(1);
            selTile = null;
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
            selTile = renderer.cameraPos(ev.offsetX, ev.offsetY);
            if(document.pointerLockElement != canvas) return;
            renderer.cameraTranslate(ev.movementX, ev.movementY);
            needsRerender = true;
        }}
        on:wheel|passive={ev => {
            renderer.cameraScale(ev.deltaY > 0 ? 0.9 : 1.1);
            selTile = renderer.cameraPos(ev.offsetX, ev.offsetY);
            needsRerender = true;
        }}
        on:contextmenu={ev => {
            ev.preventDefault();
        }}
    />
    <div class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1 pointer-events-none">
        <div class="float-right pointer-events-auto m-4 p-4 bg-zinc-800 bg-opacity-70 outline outline-zinc-600 rounded-lg">
            <div class="text-white font-bold">
                <span>
                    Left Click: Reveal tile<br />
                    Right Click: Flag tile<br />
                    Middle Click: Drag view<br />
                    Scroll Wheel: Zoom view<br />
                </span>
                {#if selTile}
                    <span>Tile: {selTile.x} {selTile.y}</span>
                {/if}
            </div>
        </div>
    </div>
</div>
