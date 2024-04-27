<script lang="ts">
    import Game from "$components/Game.svelte";
    import { resize } from "$lib/actions/Resize";
    import { onMount } from "svelte";
    import LucideInfo from "lucide-svelte/icons/info";
    import Modal from "$components/Modal.svelte";
    import InfoModal from "$components/InfoModal.svelte";
    import { world } from "../store";
    import LucideSkull from "lucide-svelte/icons/skull";

    let saveSlot: string | null = null;

    onMount(() => {
        const url = new URL(location.href);
        saveSlot = url.searchParams.get('saveSlot') ?? 'save';
    });

    let layout: 'vertical' | 'horizontal' = 'vertical';
    let layoutSide: 'start' | 'end' = 'end';

    let infoModalVisible: boolean = true;



    let deaths: number | null;

    $: if($world !== null) {
        deaths = $world.deaths;
        $world.addEventListener('die', () => {
            deaths = $world.deaths;
        });
    } else {
        deaths = null;
    }

</script>

<div class="w-screen h-screen grid grid-cols-1 grid-rows-1">
    <div class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1">
        {#if saveSlot}
            <Game {saveSlot} />
        {/if}
    </div>
    <div
        class="w-full h-full col-start-1 col-end-1 row-start-1 row-end-1 pointer-events-none"
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
                {#if deaths !== null}
                    <div class="w-full h-full bg-white rounded-full p-[1px]" />
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
                {/if}
            </div>
        </div>
    </div>
</div>


<Modal bind:visible={infoModalVisible}>
    <InfoModal />
</Modal>
