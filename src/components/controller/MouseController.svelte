<script lang="ts">
    import { distance } from "$lib/Util";
    import { createControllerDispatcher, type ControllerInputType } from "./Controller.svelte";
    const dispatcher = createControllerDispatcher();

    let _class: string = '';
    export { _class as class };

    let input: ControllerInputType | 'drag' | null = null;
    const inputTypeFromMouse = (ev: MouseEvent): ControllerInputType | null => {
        switch(ev.button) {
            case 0: return 'primary';
            case 1: return 'extra';
            case 2: return 'secondary';
            default: return null;
        }
    }

    let startX: number = 0;
    let startY: number = 0;

    const dragDistance: number = 10;
    const cancelDistance: number = 10;
    const distanceExceeded = (ev: MouseEvent, threshold: number): boolean => {
        return distance(startX, startY, ev.offsetX, ev.offsetY) > threshold;
    }

</script>

<style lang="scss">
    .mouse-controller-dragging {
        @apply cursor-move;
    }
</style>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
    class={_class}
    class:mouse-controller-dragging={input == 'drag'}
    on:mousedown={ev => {
        if(input != null) return;
        
        input = inputTypeFromMouse(ev);
        startX = ev.offsetX;
        startY = ev.offsetY;
    }}
    on:mousemove={ev => {
        let dx = ev.movementX;
        let dy = ev.movementY;
        if(input == 'primary') {
            if(distanceExceeded(ev, dragDistance)) {
                dx += ev.offsetX - startX;
                dy += ev.offsetY - startY;
                input = 'drag';
            } else {
                return;
            }
        }

        if(input != 'drag') return;

        dispatcher('move', {
            x: ev.offsetX,
            y: ev.offsetY,
            dx,
            dy
        });
    }}
    on:mouseup={ev => {
        if(input == null || input == 'drag' || distanceExceeded(ev, cancelDistance)) {
            input = null;
            return;
        }

        dispatcher('input', {
            x: ev.offsetX,
            y: ev.offsetY,
            type: input
        });

        input = null;
    }}
    on:mouseout={() => {
        input = null;
    }}
    on:wheel|passive={ev => {
        dispatcher('zoom', {
            x: ev.offsetX,
            y: ev.offsetY,
            amountType: 'absolute',
            amount: ev.deltaY > 0 ? 0.9 : 1.1
        });
    }}
    on:contextmenu|preventDefault
>
    <slot />
</div>