<script lang="ts">
    import { WorldRenderer } from "$lib/game/Renderer";
    import { World } from "$lib/game/World";
    import LucideInfo from "lucide-svelte/icons/info";
    import Modal from "$components/Modal.svelte";
    import Game from "$components/Game.svelte";
    import { onMount } from "svelte";

    let saveSlot: string | null = null;

    onMount(() => {
        const url = new URL(location.href);
        saveSlot = url.searchParams.get('saveSlot') ?? 'save';
    });

    let infoModalVisible: boolean = true;

    let world: World;
    let renderer: WorldRenderer;
    let debugNumFrames: number = 0;
    let debugFrameTime: number = 0;

</script>

<div class="w-screen h-screen grid grid-cols-1 grid-rows-1">
    <div class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1">
        {#if saveSlot}
            <Game {saveSlot} bind:debugNumFrames bind:debugFrameTime on:worldChange={ev => world = ev.detail} on:rendererChange={ev => renderer = ev.detail} />
        {/if}
    </div>
    <div class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1 pointer-events-none">
        <div class="w-full h-full flex justify-between">
            <div class="pointer-events-auto p-4 h-min">
                <button
                    class="text-blue-500 bg-zinc-800 outline outline-black outline-1 rounded-full w-min flex items-center justify-center"
                    on:click={() => infoModalVisible = true}
                >
                    <LucideInfo size={32} strokeWidth={3} />
                </button>
            </div>
            <div class="pointer-events-auto p-4 h-min">
                <div class="p-4 bg-zinc-800 bg-opacity-70 outline outline-zinc-600 rounded-lg">
                    <div class="text-white font-bold">
                        {#if world}
                            <span>
                                Seed: {world.seed}
                            </span><br />
                        {/if}
                        <span>
                            Frame {debugNumFrames}
                            {Math.round(debugFrameTime * 10) / 10}ms
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
