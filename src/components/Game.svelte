<script lang="ts">
    import { load, save } from "$lib/game/Save";
    import { World } from "$lib/game/World";
    import { onMount, onDestroy } from "svelte";
    import Renderer from "./Renderer.svelte";
    import { Viewport } from "$lib/game/Viewport";
    import type { Bookmark } from "./BookmarksModal.svelte";

    export let saveSlot: string;
    export let world: World;
    export let viewport: Viewport;

    export let bookmarks: Bookmark[] = [];

    onMount(async () => {
        const save = load(saveSlot);
        world = save.world;
        viewport = save.viewport ?? new Viewport(world);
        bookmarks = save.bookmarks ?? [];
    });

    onDestroy(() => {
        world.destroyDispatcher();
        viewport.destroyDispatcher();
        // FIXME: Fix onDestroy renderer error.
        // world.destroyDispatcher();
        // save(saveSlot, world);
        location.reload();
    });

</script>

<svelte:window
    on:beforeunload={() => {
        save(saveSlot, { world, viewport, bookmarks });
    }}
/>

{#if world && viewport}
    <Renderer {world} theme={'retro'} {viewport} on:action={ev => {
        if(ev.detail.type == 'reveal') {
            world.reveal(ev.detail.pos.x, ev.detail.pos.y);
        } else if(ev.detail.type == 'flag') {
            world.flag(ev.detail.pos.x, ev.detail.pos.y);
        } else if(ev.detail.type == 'reset') {
            world.reset(ev.detail.pos.x, ev.detail.pos.y);
        }
    }} />
{/if}
