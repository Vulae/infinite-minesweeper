<script lang="ts">
    import { load, save } from "$lib/game/Save";
    import { World } from "$lib/game/World";
    import { onMount, onDestroy } from "svelte";
    import Renderer from "./Renderer.svelte";
    import type { Theme } from "$lib/game/theme/Theme";
    import { ThemeRetro } from "$lib/game/theme/retro";
    import { volume } from "../store";
    import { Viewport } from "$lib/game/Viewport";
    import type { Bookmark } from "./BookmarksModal.svelte";

    export let saveSlot: string;
    export let world: World;
    let theme: Theme = new ThemeRetro();
    export let viewport: Viewport;

    export let bookmarks: Bookmark[] = [];

    $: theme.volume = $volume;

    onMount(async () => {
        await theme.init();

        const save = load(saveSlot);
        world = save.world;
        viewport = save.viewport ?? new Viewport(world);
        bookmarks = save.bookmarks ?? [];

        world.addEventListener('sound_unflag', () => {
            theme.playSound('unflag');
        });
        world.addEventListener('sound_reveal', ({ data: count }) => {
            theme.playSound('reveal', count / 10 + 0.9);
        });
        world.addEventListener('sound_explosion', () => {
            theme.playSound('explosion');
        });
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

{#if world && theme && viewport}
    <Renderer {world} {theme} {viewport} on:action={ev => {
        if(ev.detail.type == 'reveal') {
            world.reveal(ev.detail.pos.x, ev.detail.pos.y);
        } else if(ev.detail.type == 'flag') {
            world.flag(ev.detail.pos.x, ev.detail.pos.y);
        } else if(ev.detail.type == 'reset') {
            world.reset(ev.detail.pos.x, ev.detail.pos.y);
        }
    }} />
{/if}
