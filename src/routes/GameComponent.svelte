<script lang="ts">
    import type { Game } from '$lib/game/game';
    import { Renderer } from '$lib/game/renderer/renderer';
    import { onMount } from 'svelte';
    import Controller from './Controller.svelte';
    import { Viewport } from '$lib/game/viewport';

    let {
        game
    }: {
        game: Game;
    } = $props();

    let tilesetLoaded: boolean = false;

    let worldCanvas: HTMLCanvasElement;
    let particleCanvas: HTMLCanvasElement;
    let overlayCanvas: HTMLCanvasElement;

    let viewport = new Viewport(game.world);
    let renderer = new Renderer(game, viewport);

    let animationFrame: number = -1;

    $effect(() => {
        renderer.worldRenderer.setCanvas(worldCanvas);
    });

    $effect(() => {
        renderer.particleRenderer.setCanvas(particleCanvas);
    });

    $effect(() => {
        renderer.overlayRenderer.setCanvas(overlayCanvas);
    });

    const resizeCanvas = (canvas: HTMLCanvasElement) => {
        const newWidth = canvas.clientWidth * devicePixelRatio;
        const newHeight = canvas.clientHeight * devicePixelRatio;
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            renderer.setNeedsRerender();
        }
    };

    const render = () => {
        resizeCanvas(worldCanvas);
        resizeCanvas(particleCanvas);
        resizeCanvas(overlayCanvas);

        if (tilesetLoaded) {
            renderer.render();
        }

        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => render());
    };

    onMount(() => {
        console.log(game, renderer);
        renderer.TILESET.awaitLoad().then(() => {
            tilesetLoaded = true;
            renderer.setNeedsRerender();
        });
        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => render());
        return () => {
            cancelAnimationFrame(animationFrame);
            renderer.worldRenderer.setCanvas(null);
        };
    });
</script>

<div class="h-screen w-full">
    <Controller
        class="grid h-full w-full grid-cols-1 grid-rows-1"
        oncontrollermove={(_x, _y, dx, dy) => {
            renderer.viewport.translate(worldCanvas, dx, dy);
            renderer.setNeedsRerender();
        }}
        oncontrollerzoom={(x, y, type, value) => {
            if (type === 'relative') {
                const newScale = renderer.viewport.scale * value;
                const clampedScale = renderer.viewport.clampScale(worldCanvas, newScale, 4, 256);
                renderer.viewport.scaleFrom(worldCanvas, clampedScale, x, y);
            } else {
                const clampedScale = renderer.viewport.clampScale(worldCanvas, value, 4, 256);
                renderer.viewport.scaleFrom(worldCanvas, clampedScale, x, y);
            }
            renderer.setNeedsRerender();
        }}
        oncontrollerinput={(x, y, button) => {
            if (renderer.worldRenderer.isLowres()) return;
            const worldPos = renderer.viewport.canvasPos(worldCanvas, x, y, true);
            switch (button) {
                case 'primary':
                    game.world.revealTile(worldPos.x, worldPos.y);
                    break;
                case 'secondary':
                    game.world.flagTile(worldPos.x, worldPos.y);
                    break;
            }
            renderer.worldRenderer.setNeedsRerender();
        }}
        oncontrollerhover={(pos) => {
            if (renderer.worldRenderer.isLowres()) {
                if (renderer.overlayRenderer.hoverTile != null) {
                    renderer.overlayRenderer.hoverTile = null;
                    renderer.overlayRenderer.setNeedsRerender();
                }
                return;
            }
            let lastHoverTileX: number | null = null;
            let lastHoverTileY: number | null = null;
            if (renderer.overlayRenderer.hoverTile != null) {
                lastHoverTileX = renderer.overlayRenderer.hoverTile.x;
                lastHoverTileY = renderer.overlayRenderer.hoverTile.y;
            }
            if (!pos) {
                renderer.overlayRenderer.hoverTile = null;
            } else {
                const worldPos = renderer.viewport.canvasPos(worldCanvas, pos.x, pos.y, true);
                renderer.overlayRenderer.hoverTile = worldPos;
            }
            if (
                (renderer.overlayRenderer.hoverTile ?? { x: null }).x !== lastHoverTileX ||
                (renderer.overlayRenderer.hoverTile ?? { y: null }).y !== lastHoverTileY
            ) {
                renderer.overlayRenderer.setNeedsRerender();
            }
        }}
    >
        <canvas
            bind:this={worldCanvas}
            class="col-start-1 col-end-1 row-start-1 row-end-1 h-full w-full"
        ></canvas>
        <canvas
            bind:this={particleCanvas}
            class="col-start-1 col-end-1 row-start-1 row-end-1 h-full w-full"
        ></canvas>
        <canvas
            bind:this={overlayCanvas}
            class="col-start-1 col-end-1 row-start-1 row-end-1 h-full w-full"
        ></canvas>
    </Controller>
</div>
