<script lang="ts">
    import { WorldRenderer } from "$lib/Renderer";
    import { World, type WorldSave } from "$lib/World";
    import { resize } from "$lib/actions/Resize";
    import { onDestroy, onMount } from "svelte";
    import { tileset } from "$lib/Assets";
    import { CHUNK_SIZE } from "$lib/Constants";
    import LucideInfo from "lucide-svelte/icons/info";
    import Modal from "$components/Modal.svelte";

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

    let keys: Set<string> = new Set();
    let keysInterval: number = -1;

    onMount(() => {
        load();

        tileset.onLoad(() => {
            needsRerender = true;
        });

        // TODO: Clean Up!
        clearInterval(keysInterval);
        keysInterval = setInterval(() => {
            let change: boolean = false;

            if(keys.has('[')) { renderer.cameraScale(1.04); selTile = null; change = true; }
            if(keys.has(']')) { renderer.cameraScale(0.96); selTile = null; change = true; }
            if(keys.has('ArrowUp')) { renderer.cameraTranslate(0, 10); change = true; }
            if(keys.has('ArrowDown')) { renderer.cameraTranslate(0, -10); change = true; }
            if(keys.has('ArrowLeft')) { renderer.cameraTranslate(10, 0); change = true; }
            if(keys.has('ArrowRight')) { renderer.cameraTranslate(-10, 0); change = true; }

            if(change) {
                needsRerender = true;
            }
        }, 1000 / 60);

        render();
    });

    onDestroy(() => {
        cancelAnimationFrame(animFrame);
        clearInterval(keysInterval);
        save();
    });

    let infoModalVisible: boolean = true;

</script>
<svelte:window
    on:keydown={ev => {
        keys.add(ev.key);
    }}
    on:keyup={ev => {
        keys.delete(ev.key);
    }}
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
        <div class="w-full h-full flex justify-between">
            <div class="pointer-events-auto p-4">
                <button
                    class="text-blue-500 bg-zinc-800 outline outline-black outline-1 rounded-full w-min flex items-center justify-center"
                    on:click={() => infoModalVisible = true}
                >
                    <LucideInfo size={32} strokeWidth={3} />
                </button>
            </div>
            <div class="pointer-events-auto p-4">
                <div class="p-4 bg-zinc-800 bg-opacity-70 outline outline-zinc-600 rounded-lg">
                    <div class="text-white font-bold">
                        {#if world}
                            <span>
                                Seed: {world.seed}
                            </span><br />
                        {/if}
                        {#if selTile}
                            <span>Tile: {selTile.x} {selTile.y}</span>
                            <br />
                            <span>Chunk: {Math.floor(selTile.x / CHUNK_SIZE)} {Math.floor(selTile.y / CHUNK_SIZE)}</span>
                            <br />
                        {/if}
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
    </div>
</div>

<Modal bind:visible={infoModalVisible} title="Information">
    <span class=" text-white font-semibold font-segoe">
        <h1 class="text-2xl">
            <a href="https://vulae.github.io/infinite-minesweeper">Infinite Minesweeper</a>
        </h1>
        <h2 class="text-xl">CONTROLS</h2>
        Left Click: Reveal tile
        <br />
        Right Click: Flag tile
        <br />
        Middle Click / Arrow Keys: Move view
        <br />
        Scroll Wheel: Zoom view
        <br />
        Open Bracket '[': Zoom In
        <br />
        Close Bracket ']': Zoom Out
        <br />
    </span>
</Modal>
