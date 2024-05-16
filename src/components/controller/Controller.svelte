<script context="module" lang="ts">
    import { createEventDispatcher, type EventDispatcher } from "svelte";

    export type ControllerInputType = 'primary' | 'secondary' | 'extra';

    export function createControllerDispatcher(): EventDispatcher<{
        move: {
            x: number;
            y: number;
            dx: number;
            dy: number;
        };
        zoom: {
            x: number;
            y: number;
            amountType: 'relative' | 'absolute';
            amount: number;
        };
        input: {
            x: number;
            y: number;
            type: ControllerInputType;
        };
    }> {
        return createEventDispatcher();
    }
</script>

<script lang="ts">
    import MouseController from "./MouseController.svelte";
    import TouchController from "./TouchController.svelte";
    const dispatcher = createControllerDispatcher();

    let _class: string = '';
    export { _class as class };

    export let inputMethod: 'mouse' | 'keyboard' | 'touch' = 'mouse';

</script>

{#if inputMethod == 'mouse'}
    <MouseController
        class={_class}
        on:move={ev => dispatcher('move', ev.detail)}
        on:zoom={ev => dispatcher('zoom', ev.detail)}
        on:input={ev => dispatcher('input', ev.detail)}
    >
        <slot />
    </MouseController>
{:else if inputMethod == 'keyboard'}
    <span>Keyboard input method not implemented.</span>
{:else if inputMethod == 'touch'}
    <TouchController
        class={_class}
        on:move={ev => dispatcher('move', ev.detail)}
        on:zoom={ev => dispatcher('zoom', ev.detail)}
        on:input={ev => dispatcher('input', ev.detail)}
    >
        <slot />
    </TouchController>
{:else}
    <span>Unsupported input method.</span>
{/if}
