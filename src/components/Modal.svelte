<!-- This is definitely not the way to do modals. -->
<!-- A better way is to have a ModalManager that displays all the modals from the root of the HTML. -->
<script lang="ts">
    import LucideX from "lucide-svelte/icons/x";

    export let visible: boolean = false;
    export let title: string;
    export let closable: boolean = true;
    
</script>

{#if visible}
    <div class="z-50 fixed top-0 left-0 w-screen h-screen">
        <div class="relative w-full h-full flex justify-center items-center">
            <div class="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50">
                {#if closable}
                    <button
                        class="absolute top-0 left-0 w-full h-full"
                        title="Close {title}"
                        on:click={() => visible = false}
                    />
                {/if}
            </div>
            <div class="z-20 border-zinc-800 border-2 bg-zinc-900">
                <div class="border-zinc-800 border-b-2 px-2 py-1 text-white font-semibold flex justify-between items-center gap-4">
                    <span>
                        {title}
                    </span>
                    {#if closable}
                        <button
                            class="float-right"
                            title="Close {title}"
                            on:click={() => visible = false}
                        >
                            <LucideX />
                        </button>
                    {/if}
                </div>
                <div class="px-2 py-1">
                    <slot />
                </div>
            </div>
        </div>
    </div>
{/if}
