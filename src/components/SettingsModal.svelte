<script lang="ts">
    import { clear } from "$lib/game/Save";
    import { onDestroy } from "svelte";
    import { autoDisplayInfo, inputMethod, volume } from "../store";

    export let saveSlot: string;
    let clearSaveConfirmTimeout: number = -1;
    const clearSaveConfirmTime: number = 5000;
    let clearSaveConfirm: boolean = false;

    onDestroy(() => {
        clearTimeout(clearSaveConfirmTimeout);
    });

</script>

<div class="grid px-4 py-2 rounded-2xl bg-white bg-opacity-50">
    <span class="text-2xl font-bold text-center">
        Settings
    </span>
    <div class="w-full h-1 bg-black bg-opacity-50 my-2 rounded-full" />
    <div class="p-2 max-h-96 overflow-y-auto flex flex-col gap-4 font-semibold">
        <div class="flex justify-between items-center gap-3">
            Input Method
            <select
                bind:value={$inputMethod}
            >
                <option value={'mouse'}>Mouse</option>
                <option value={'touch'}>Touch</option>
            </select>
        </div>
        <div class="flex justify-between items-center gap-3">
            Volume
            <input
                type="range"
                min="0" max="1" step="0.05"
                value={$volume}
                on:change={ev => {
                    $volume = ev.currentTarget.valueAsNumber;
                }}
                title="{Math.round($volume * 100)}% Volume"
            >
        </div>
        <div class="flex justify-between items-center gap-3">
            Display information on load
            <input
                type="checkbox"
                bind:checked={$autoDisplayInfo}
            >
        </div>
        <button
            class="bg-black font-bold text-red-500 rounded-lg py-1"
            on:click={() => {
                if(!clearSaveConfirm) {
                    clearSaveConfirm = true;
                    clearSaveConfirmTimeout = setTimeout(() => {
                        clearSaveConfirm = false;
                    }, clearSaveConfirmTime);
                } else {
                    clearSaveConfirm = false;
                    clear(saveSlot);
                    location.reload();
                }
            }}
        >
            {#if !clearSaveConfirm}
                CLEAR SAVE
            {:else}
                ARE YOU SURE?
            {/if}
        </button>
    </div>
</div>
