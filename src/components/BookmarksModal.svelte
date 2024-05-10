<script context="module" lang="ts">
    export interface Bookmark {
        name: string;
        createdAt: Date;
        viewport: {
            x: number;
            y: number;
            zoom: number;
        };
    }
</script>

<script lang="ts">
    import LucidePlus from "lucide-svelte/icons/plus";
    import LucideBookmarkMinus from "lucide-svelte/icons/bookmark-minus";
    import type { Viewport } from "$lib/game/Viewport";

    export let viewport: Viewport;

    export let bookmarks: Bookmark[];

    let newBookmarkNameInput: HTMLInputElement;

    export let visible: boolean;

</script>

<style lang="scss">

    ::-webkit-scrollbar {
        @apply w-2;
    }

    ::-webkit-scrollbar-track {
        @apply rounded-full bg-black bg-opacity-50;
    }

    ::-webkit-scrollbar-thumb {
        @apply rounded-full bg-gray-50 transition-colors;

        &:hover {
            @apply bg-gray-200;
        }

        &:active {
            @apply bg-gray-300;
        }
    }

</style>

<div class="grid px-4 py-2 rounded-2xl bg-white bg-opacity-50">
    <span class="text-2xl font-bold text-center">
        Bookmarks
    </span>
    <div class="w-full h-1 bg-black bg-opacity-50 my-2 rounded-full" />
    <ul class="p-2 max-h-96 overflow-y-auto">
        {#each bookmarks as bookmark, i}
            <li class="flex justify-between items-center">
                <button
                    class="flex flex-col ml-4 hover:text-blue-800 transition-colors"
                    on:click={() => {
                        viewport.cameraZoom = bookmark.viewport.zoom;
                        viewport.cameraX = bookmark.viewport.x - viewport.cameraWidth() / 2;
                        viewport.cameraY = bookmark.viewport.y - viewport.cameraHeight() / 2;
                        viewport.change();
                        visible = false;
                    }}
                >
                    <span class="text-xs font-normal">
                        {bookmark.createdAt.toLocaleDateString()}
                        {bookmark.createdAt.toLocaleTimeString()}
                    </span>
                    <div class="text-xl font-bold">
                        {bookmark.name}
                    </div>
                </button>
                <button
                    class="hover:text-red-900 transition-colors"
                    title="Remove Bookmark"
                    on:click={() => {
                        bookmarks?.splice(i, 1);
                        bookmarks = bookmarks;
                    }}
                >
                    <LucideBookmarkMinus size="2rem" />
                </button>
            </li>
            {#if i < bookmarks.length - 1}
                <div class="w-full h-0.5 bg-black bg-opacity-50 my-1 rounded-full" />
            {/if}
        {/each}
        {#if bookmarks.length == 0}
            <li class="text-xl font-bold">
                You have no bookmarks.
            </li>
        {/if}
    </ul>
    <div class="w-full h-1 bg-black bg-opacity-50 my-2 rounded-full" />
    <form
        class="flex justify-between gap-4 px-2 pb-2"
        on:submit={() => {
            if(newBookmarkNameInput.value.length == 0) return;
            bookmarks?.push({
                name: newBookmarkNameInput.value,
                createdAt: new Date(),
                viewport: {
                    x: viewport.cameraX + viewport.cameraWidth() / 2,
                    y: viewport.cameraY + viewport.cameraHeight() / 2,
                    zoom: viewport.cameraZoom
                }
            });
            bookmarks = bookmarks;
            newBookmarkNameInput.value = '';
        }}
    >
        <input
            bind:this={newBookmarkNameInput}
            placeholder="New Bookmark"
            type="text"
            maxlength="16"
            on:keydown|stopPropagation
            class="w-48 px-2 rounded-md"
        />
        <button
            type="submit"
            title="Create Bookmark"
            class="flex hover:text-green-900 transition-colors"
        >
            <LucidePlus size="2rem" />
        </button>
    </form>
</div>
