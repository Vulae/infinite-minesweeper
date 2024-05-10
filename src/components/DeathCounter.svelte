<script lang="ts">
    import type { EventListener } from "$lib/EventDispatcher";
    import type { World } from "$lib/game/World";
    import LucideSkull from "lucide-svelte/icons/skull";

    export let layout: 'vertical' | 'horizontal';
    export let world: World;

    let listener: EventListener;
    let deaths: number = 0;

    let lastWorld: World | null = null;
    $: if(world) {
        lastWorld?.removeEventListener(listener);

        deaths = world.deaths;
        listener = world.addEventListener('die', () => {
            deaths = world.deaths;
        });

        lastWorld = world;
    }

</script>

<div
    class="flex items-center"
    style:flex-direction={layout == 'horizontal' ? 'row' : 'column'}
    title="{deaths} deaths"
>
    <LucideSkull />
    <span class="text-sm">
        {deaths}
    </span>
</div>
