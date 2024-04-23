<script lang="ts">
    import { WorldRenderer } from "$lib/Renderer";
    import { World, type WorldSave } from "$lib/World";
    import { resize } from "$lib/actions/Resize";
    import { onDestroy, onMount } from "svelte";
    import { tileset } from "$lib/Assets";
    import { CHUNK_SIZE } from "$lib/Constants";

    let canvas: HTMLCanvasElement;
    let firstCanvasResize: boolean = true;

    let world: World;
    let renderer: WorldRenderer;

    $: if(world) {
        console.log(world);
    }

    function load(): void {
        const str = localStorage.getItem('save');
        if(!str) {
            console.log('Loaded new world');
            localStorage.setItem('save', 'PLACEHOLDER');
            world = new World(Math.floor(Math.random() * 0xFFFFFFFF));
            const closest0 = world.closest0(0, 0);
            world.reveal(closest0.x, closest0.y);
        } else {
            console.log('Loaded saved world');
            const save: WorldSave = JSON.parse(str);
            world = World.load(save);
        }
        renderer = new WorldRenderer(world, canvas);
        firstCanvasResize = true;
    }

    function save(): void {
        if(localStorage.getItem('save') !== null) {
            console.log('Save world');
            localStorage.setItem('save', JSON.stringify(world.save()));
        }
    }

    let needsRerender: boolean = false;
    let animFrame: number = -1;
    let numFrames: number = 0;
    let frameTime: number | null = null;
    const render = () => {
        cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(render);
        if(needsRerender) {
            needsRerender = false;
            numFrames++;
            const start = performance.now();
            renderer.render();
            frameTime = performance.now() - start;
        }
    }

    let selTile: { x: number, y: number } | null = null;

    onMount(() => {
        load();

        tileset.onLoad(() => {
            needsRerender = true;
        });

        render();
    });

    onDestroy(() => {
        cancelAnimationFrame(animFrame);
        save();
    });
</script>

<svelte:window
    on:unload={() => {
        save();
    }}
/>

<div class="w-screen h-screen grid grid-cols-1 grid-rows-1">
    <canvas
        class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1"
        bind:this={canvas}
        use:resize={(width, height) => {
            canvas.width = width;
            canvas.height = height;
            renderer.cameraScale(1);
            selTile = null;
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
            const scale = ev.deltaY > 0 ? 0.9 : 1.1;
            if(renderer.cameraZoom != renderer.cameraScale(scale)) {
                selTile = renderer.cameraPos(ev.offsetX, ev.offsetY);
                needsRerender = true;
            }
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
                {#if world}
                    <span>
                        Seed: {world.seed}
                    </span><br />
                {/if}
                {#if selTile}
                    <span>Tile: {selTile.x} {selTile.y}</span>
                    <br />
                    <span>Chunk: {Math.floor(selTile.x / CHUNK_SIZE)} {Math.floor(selTile.y / CHUNK_SIZE)}</span>
                {/if}<br />
                <span>
                    Frame {numFrames}
                    {#if frameTime !== null}
                        {Math.round(frameTime * 10) / 10}ms
                    {/if}
                </span>
            </div>
        </div>
    </div>
</div>
