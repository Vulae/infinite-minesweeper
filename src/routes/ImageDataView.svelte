<script lang="ts">
    import { onMount } from 'svelte';

    let {
        image,
        class: _class = ''
    }: {
        image: ImageData;
        class?: string;
    } = $props();

    let canvas: HTMLCanvasElement;

    onMount(() => {
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(image, 0, 0);
    });
</script>

<canvas bind:this={canvas} class={_class}></canvas>
