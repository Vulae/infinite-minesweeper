<!-- TODO: Fade out animation -->
<script lang="ts">
    export let visible: boolean = false;
    export let closable: boolean = true;
    
</script>

<style lang="scss">

    .modal {
        @apply fixed top-0 left-0 bottom-0 right-0;
        @apply grid grid-cols-1 grid-rows-1;

        & > .modal-background {
            @apply backdrop-blur;

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

        & > .modal-content {
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

        & > .modal-background, & > .modal-content {
            @apply w-full h-full col-start-1 col-end-1 row-start-1 row-end-1;
        }
    }

</style>

{#if visible}
    <div class="modal fixed top-0 left-0 bottom-0 right-0
    grid grid-cols-1 grid-rows-1">
        <div class="modal-background -z-10 bg-black bg-opacity-30 shadow-vignette-heavy">
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
