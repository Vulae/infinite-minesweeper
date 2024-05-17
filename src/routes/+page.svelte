<script lang="ts">
    import Game from "$components/Game.svelte";
    import { resize } from "$lib/actions/Resize";
    import LucideInfo from "lucide-svelte/icons/info";
    import Modal from "$components/Modal.svelte";
    import InfoModal from "$components/InfoModal.svelte";
    import type { World } from "$lib/game/World";
    import DeathCounter from "$components/DeathCounter.svelte";
    import BookmarksModal, { type Bookmark } from "$components/BookmarksModal.svelte";
    import type { Viewport } from "$lib/game/Viewport";
    import LucideBookmark from "lucide-svelte/icons/bookmark";
    import SettingsModal from "$components/SettingsModal.svelte";
    import LucideSettings from "lucide-svelte/icons/settings";
    import { onMount } from "svelte";
    import { autoDisplayInfo } from "../store";

    let saveSlot: string = 'save';

    let layout: 'vertical' | 'horizontal' = 'vertical';
    let layoutSide: 'start' | 'end' = 'end';

    let infoModalVisible: boolean = false;
    let settingsModalVisible: boolean = false;
    let bookmarksModalVisible: boolean = false;

    let world: World;
    let viewport: Viewport;
    let bookmarks: Bookmark[] = [];

    onMount(() => {
        if($autoDisplayInfo) {
            infoModalVisible = true;
        }
    });

</script>

<div class="w-screen h-screen grid grid-cols-1 grid-rows-1">
    <div class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1">
        <Game {saveSlot} bind:world bind:viewport bind:bookmarks />
    </div>
    <!-- TODO: transition-opacity, the backdrop blur breaks when opacity is less than 1, So the blur needs to be done another way. -->
    <div
        class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1 pointer-events-none"
        style:opacity={(infoModalVisible || settingsModalVisible || bookmarksModalVisible) ? 0 : 1}
        use:resize={(width, height) => {
            layout = (width > height) ? 'vertical' : 'horizontal';
            layoutSide = (width > height) ? 'end' : 'start';
        }}
    >
        <div
            class="w-full h-full flex items-center p-4"
            style:flex-direction={layout == 'vertical' ? 'row' : 'column'}
            style:justify-content={layoutSide == 'start' ? 'start' : 'end'}
        >
            <div
                class="pointer-events-auto flex items-center gap-2
                rounded-full bg-white bg-opacity-30 backdrop-blur-md shadow-lg
                text-white font-bold stroke-[3]"
                style:flex-direction={layout == 'vertical' ? 'column' : 'row'}
                style:padding={layout == 'vertical' ? '1rem 0.5rem' : '0.5rem 1rem'}
            >
                <button
                    class="rounded-full drop-shadow-sm"
                    on:click={() => infoModalVisible = true}
                    title="Information"
                >
                    <LucideInfo />
                </button>
                <button
                    class="rounded-full drop-shadow-sm"
                    on:click={() => settingsModalVisible = true}
                    title="Settings"
                >
                    <LucideSettings />
                </button>
                <button
                    class="rounded-full drop-shadow-sm"
                    on:click={() => bookmarksModalVisible = true}
                    title="Bookmarks"
                >
                    <LucideBookmark />
                </button>
                <div class="w-full h-full bg-white rounded-full p-[1px]" />
                <DeathCounter {layout} {world} />
            </div>
        </div>
    </div>
</div>

<Modal bind:visible={infoModalVisible}>
    <InfoModal />
</Modal>

<Modal bind:visible={settingsModalVisible}>
    <SettingsModal bind:saveSlot />
</Modal>

<Modal bind:visible={bookmarksModalVisible}>
    <BookmarksModal bind:visible={bookmarksModalVisible} {viewport} bind:bookmarks />
</Modal>
