<script lang="ts">
    import type { Game } from '$lib/game/game';
    import { Renderer } from '$lib/game/renderer';
    import { onMount } from 'svelte';
    import Controller from './Controller.svelte';

    let {
        game
    }: {
        game: Game;
    } = $props();

    let tilesetLoaded: boolean = false;

    let canvas: HTMLCanvasElement;
    let renderer = new Renderer(game);

    let animationFrame: number = -1;
    let needsRerender: boolean = false;

    $effect(() => {
        renderer.setCanvas(canvas);
        cancelAnimationFrame(animationFrame);
        if (canvas) {
            animationFrame = requestAnimationFrame(render);
        }
    });

    function render() {
        const newWidth = canvas.clientWidth * devicePixelRatio;
        const newHeight = canvas.clientHeight * devicePixelRatio;
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            needsRerender = true;
        }
        if (tilesetLoaded) {
            if (needsRerender) {
                needsRerender = false;
                renderer.render();
            }
        }
        animationFrame = requestAnimationFrame(() => render());
    }

    onMount(() => {
        console.log(game, renderer);
        renderer.TILESET.awaitLoad().then(() => {
            tilesetLoaded = true;
        });
        return () => {
            cancelAnimationFrame(animationFrame);
            renderer.setCanvas(null);
        };
    });
</script>

<div class="h-screen w-full">
    <Controller
        class="h-full w-full"
        oncontrollermove={(_x, _y, dx, dy) => {
            renderer.viewport.translate(canvas, dx, dy);
            needsRerender = true;
        }}
        oncontrollerzoom={(x, y, type, value) => {
            if (type === 'relative') {
                const newScale = renderer.viewport.scale * value;
                const clampedScale = renderer.viewport.clampScale(canvas, newScale, 4, 48);
                renderer.viewport.scaleFrom(canvas, clampedScale, x, y);
            } else {
                const clampedScale = renderer.viewport.clampScale(canvas, value, 4, 48);
                renderer.viewport.scaleFrom(canvas, clampedScale, x, y);
            }
            needsRerender = true;
        }}
        oncontrollerinput={(x, y, button) => {
            const worldPos = renderer.viewport.canvasPos(canvas, x, y, true);
            switch (button) {
                case 'primary':
                    game.world.revealTile(worldPos.x, worldPos.y);
                    break;
                case 'secondary':
                    game.world.flagTile(worldPos.x, worldPos.y);
                    break;
            }
            needsRerender = true;
        }}
        oncontrollerhover={(pos) => {
            let lastHoverTileX: number | null = null;
            let lastHoverTileY: number | null = null;
            if (renderer.hoverTile != null) {
                lastHoverTileX = renderer.hoverTile.x;
                lastHoverTileY = renderer.hoverTile.y;
            }

            if (!pos) {
                renderer.hoverTile = null;
            } else {
                const worldPos = renderer.viewport.canvasPos(canvas, pos.x, pos.y, true);
                renderer.hoverTile = worldPos;
            }

            if (
                (renderer.hoverTile ?? { x: null }).x !== lastHoverTileX ||
                (renderer.hoverTile ?? { y: null }).y !== lastHoverTileY
            ) {
                needsRerender = true;
            }
        }}
    >
        <canvas bind:this={canvas} class="h-full w-full"></canvas>
    </Controller>
</div>
