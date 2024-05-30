<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { createControllerDispatcher } from "./Controller.svelte";
    const dispatcher = createControllerDispatcher();
    import Hammer from "hammerjs";

    let _class: string = '';
    export { _class as class };

    let container: HTMLDivElement;
    let mc: HammerManager;

    let lastPan: HammerInput | null = null;

    onMount(() => {

        mc = new Hammer.Manager(container, {
            recognizers: [
                [ Hammer.Pan ],
                [ Hammer.Pinch ]
            ]
        });

        const tapSingle = new Hammer.Tap({ taps: 1, event: 'tapSingle' });
        const tapDouble = new Hammer.Tap({ taps: 2, event: 'tapDouble' });

        mc.add([ tapDouble, tapSingle ]);

        tapDouble.recognizeWith(tapSingle);
        tapSingle.requireFailure(tapDouble);

        mc.on('pan', ev => {
            if(lastPan) {
                dispatcher('move', {
                    x: ev.center.x,
                    y: ev.center.y,
                    dx: ev.center.x - lastPan.center.x,
                    dy: ev.center.y - lastPan.center.y
                });
            }
            lastPan = ev.isFinal ? null : ev;
        });

        mc.on('pinch', ev => {
            // TODO: Get this to work!
            // dispatcher('zoom', {
            //     x: ev.center.x,
            //     y: ev.center.y,
            //     amountType: 'absolute',
            //     amount: ev.scale
            // });
        });

        mc.on('tapSingle', ev => {
            dispatcher('input', {
                x: ev.center.x,
                y: ev.center.y,
                type: 'secondary'
            });
        });

        mc.on('tapDouble', ev => {
            dispatcher('input', {
                x: ev.center.x,
                y: ev.center.y,
                type: 'primary'
            });
        });
    });

    onDestroy(() => {
        mc.destroy();
    });

</script>

<div
    bind:this={container}
    class={_class}
/>
