<script lang="ts">
    import { load, save } from "$lib/game/Save";
    import { World } from "$lib/game/World";
    import { onMount, onDestroy } from "svelte";
    import Renderer from "./Renderer.svelte";

    export let saveSlot: string;
    let world: World;

    onMount(async () => {
        world = load(saveSlot);
    });

    onDestroy(() => {
        save(saveSlot, world);
    });

</script>

<svelte:window
    on:beforeunload={() => {
        save(saveSlot, world);
    }}
/>

{#if world}
    <Renderer {world} on:action={ev => {
        if(ev.detail.type == 'reveal') {
            world.reveal(ev.detail.pos.x, ev.detail.pos.y);
        } else if(ev.detail.type == 'flag') {
            world.flag(ev.detail.pos.x, ev.detail.pos.y);
        } else if(ev.detail.type == 'reset') {
            world.reset(ev.detail.pos.x, ev.detail.pos.y);
        }
    }} />
{/if}
