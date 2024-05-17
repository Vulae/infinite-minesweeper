<script lang="ts">
    import type { ArrayElement } from "$lib/Util";
    import { inputMethod } from "../store";
    import InfoModalBiomes from "./InfoModalBiomes.svelte";

    const tabNames = [ 'Information', 'Biomes', 'Controls' ] as const;
    let currentTab: ArrayElement<typeof tabNames> = 'Information';

</script>

<style lang="scss">
    
    .tab {
        @apply bg-white bg-opacity-0 transition-colors;
        
        &:hover {
            @apply bg-opacity-50;
        }

        &.selected {
            @apply bg-opacity-50;
        }
    }

</style>

<div class="grid px-4 py-2 rounded-2xl bg-white bg-opacity-50">
    <div class="px-4 grid grid-flow-col gap-4 items-center font-bold">
        {#each tabNames as tabName}
            <button
                class="tab w-full flex justify-center py-1 px-4 rounded-md"
                class:selected={tabName == currentTab}
                disabled={tabName == currentTab}
                on:click={() => currentTab = tabName}
            >
                {tabName}
            </button>
        {/each}
    </div>
    <div class="w-full h-1 bg-black bg-opacity-50 my-2 rounded-full" />
    <div class="w-[32rem] h-64 py-2 font-semibold">
        {#if currentTab == 'Information'}
            <div class="px-4 w-full h-full flex flex-col justify-between">
                <div>
                    <a class="text-2xl font-bold" href="https://vulae.github.io/infinite-minesweeper">Infinite Minesweeper</a>
                    <br />
                    An infinite twist on Minesweeper that adds biomes that change the rules of the game.
                </div>
                <div class="pt-4">
                    <span class="float-right text-xs font-extrabold">
                        *Source code available on
                        <a class="underline" href="https://github.com/Vulae/infinite-minesweeper">GitHub</a>
                    </span>
                </div>
            </div>
        {:else if currentTab == 'Biomes'}
            <div class="w-full h-full inline">
                <InfoModalBiomes />
            </div>
        {:else if currentTab == 'Controls'}
            <div class="px-4">
                {#if $inputMethod == 'mouse'}
                    <span>
                        <h1 class="font-bold text-2xl">Mouse Controls</h1>
                        Left Click: Reveal tile
                        <br />
                        Right Click: Flag tile
                        <br />
                        Left Click Drag: Move view
                        <br />
                        Scroll Wheel: Zoom view
                    </span>
                {:else if $inputMethod == 'keyboard'}
                    <span>
                        <h1 class="font-bold text-2xl">Keyboard Controls</h1>
                        Keyboard control method not yet supported.
                    </span>
                {:else if $inputMethod == 'touch'}
                    <span>
                        <h1 class="font-bold text-2xl">Touch Controls</h1>
                        Double Tap: Reveal tile
                        <br />
                        Single Tap: Flag tile
                        <br />
                        Pan: Move view
                        <br />
                        Pinch: Zoom view
                    </span>
                {:else}
                    <span>Unknown control method.</span>
                {/if}
            </div>
        {/if}
    </div>
</div>
