<!-- TODO: Fade out animation -->
<script lang="ts">
    export let visible: boolean = false;
    export let closable: boolean = true;

    export let backgroundStyle: boolean = true;
    
</script>

<style lang="scss">

    .modal {
        @apply fixed top-0 left-0 bottom-0 right-0;
    }

    .modal-background {
        @apply -z-10;
    }

    .modal-background-styled {
        @apply backdrop-blur bg-black bg-opacity-30 shadow-vignette-heavy;

        animation: modal-background-fade-in 500ms ease-in-out;

        @keyframes modal-background-fade-in {
            0% {
                opacity: 0%;
                backdrop-filter: blur(0px);
            }
            50% {
                opacity: 100%;
            }
            100% {
                backdrop-filter: blur(8px);
            }
        }
    }

    .modal-content {
        animation: modal-content-fade-in 250ms ease-in-out;

        @keyframes modal-content-fade-in {
            from {
                opacity: 0%;
            }
            to {
                opacity: 100%;
            }
        }
    }

</style>

{#if visible}
    <div class="modal force-overlap">
        <div class="modal-background" class:modal-background-styled={backgroundStyle}>
            {#if closable}
                <button class="w-full h-full" on:click={() => visible = false} aria-label="Close Modal" />
            {/if}
        </div>
        <div class="modal-content flex justify-center items-center pointer-events-none p-8">
            <div class="pointer-events-auto">
                <slot />
            </div>
        </div>
    </div>
{/if}
