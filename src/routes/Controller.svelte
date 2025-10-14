<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        class: _class = '',
        oncontrollermove,
        oncontrollerzoom,
        oncontrollerinput,
        oncontrollerhover,
        children
    }: {
        class?: string;
        oncontrollermove: (x: number, y: number, dx: number, dy: number) => void;
        oncontrollerzoom: (
            x: number,
            y: number,
            amountType: 'relative' | 'absolute',
            amount: number
        ) => void;
        oncontrollerinput: (
            x: number,
            y: number,
            type: 'primary' | 'secondary' | 'tertiary'
        ) => void;
        oncontrollerhover: (pos: { x: number; y: number } | null) => void;
        children: Snippet<[]>;
    } = $props();

    let input: 'primary' | 'secondary' | 'tertiary' | 'drag' | null = $state(null);
    let startX: number = 0;
    let startY: number = 0;

    const startDragDistance = 10;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class={_class}
    class:mouse-controller-dragging={input === 'drag'}
    onmousedown={(ev) => {
        if (input != null) return;
        input =
            ev.button === 0
                ? 'primary'
                : ev.button === 1
                  ? 'tertiary'
                  : ev.button === 2
                    ? 'secondary'
                    : null;
        startX = ev.offsetX;
        startY = ev.offsetY;
    }}
    onmousemove={(ev) => {
        oncontrollerhover({ x: ev.offsetX, y: ev.offsetY });

        let dx = ev.movementX;
        let dy = ev.movementY;
        if (input == 'primary') {
            if (Math.hypot(ev.offsetX - startX, ev.offsetY - startY) > startDragDistance) {
                dx += ev.offsetX - startX;
                dy += ev.offsetY - startY;
                input = 'drag';
            } else {
                return;
            }
        }

        if (input != 'drag') return;

        oncontrollermove(ev.offsetX, ev.offsetY, dx, dy);
    }}
    onmouseup={(ev) => {
        if (input == null || input == 'drag') {
            input = null;
            return;
        }

        oncontrollerinput(ev.offsetX, ev.offsetY, input);
        input = null;
    }}
    onmouseleave={() => {
        input = null;
        oncontrollerhover(null);
    }}
    onwheel={(ev) => {
        ev.preventDefault();
        oncontrollerzoom(ev.offsetX, ev.offsetY, 'relative', ev.deltaY > 0 ? 0.9 : 1.1);
    }}
    oncontextmenu={(ev) => {
        ev.preventDefault();
    }}
>
    {@render children()}
</div>

<style>
    .mouse-controller-dragging {
        cursor: grabbing;
    }
</style>
