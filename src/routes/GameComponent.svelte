<script lang="ts">
    import type { Game } from '$lib/game/game';
    import { Renderer } from '$lib/game/renderer/renderer';
    import { onMount } from 'svelte';
    import Controller from './Controller.svelte';
    import { Viewport } from '$lib/game/viewport';
    import Modal from './Modal.svelte';
    import ImageDataView from './ImageDataView.svelte';

    let {
        game,
        beginScreenshot = $bindable()
    }: {
        game: Game;
        beginScreenshot: () => void;
    } = $props();

    let tilesetLoaded: boolean = false;

    let worldCanvas: HTMLCanvasElement;
    let particleCanvas: HTMLCanvasElement;
    let overlayCanvas: HTMLCanvasElement;

    let viewport = new Viewport(game.world);
    let renderer = new Renderer(game, viewport);

    let animationFrame: number = -1;

    let screenshotState:
        | {
              state: 'none';
          }
        | {
              state: 'capture_pos1';
          }
        | {
              state: 'capture_pos2';
              x: number;
              y: number;
          }
        | {
              state: 'view';
              x: number;
              y: number;
              width: number;
              height: number;
          } = $state({ state: 'none' });

    $effect(() => {
        renderer.worldRenderer.setCanvas(worldCanvas);
        renderer.particleRenderer.setCanvas(particleCanvas);
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

        beginScreenshot = () => {
            if (screenshotState.state == 'none') {
                screenshotState = { state: 'capture_pos1' };
            }
        };

        renderer.TILESET.awaitLoad().then(() => {
            tilesetLoaded = true;
            renderer.setNeedsRerender();
        });

        cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(() => render());

        return () => {
            beginScreenshot = () => {};

            cancelAnimationFrame(animationFrame);
            renderer.worldRenderer.setCanvas(null);
        };
    });
</script>

<div class="force-overlap h-screen w-full">
    <Controller
        class="force-overlap h-full w-full"
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
            const worldPos = renderer.viewport.canvasPos(worldCanvas, x, y, true);

            switch (screenshotState.state) {
                case 'none':
                    break;
                case 'capture_pos1': {
                    if (button == 'primary') {
                        screenshotState = { state: 'capture_pos2', x: worldPos.x, y: worldPos.y };
                    }
                    return;
                }
                case 'capture_pos2': {
                    if (button == 'primary') {
                        const sx = Math.min(screenshotState.x, worldPos.x);
                        const sy = Math.min(screenshotState.y, worldPos.y);
                        const ex = Math.max(screenshotState.x, worldPos.x);
                        const ey = Math.max(screenshotState.y, worldPos.y);
                        screenshotState = {
                            state: 'view',
                            x: sx,
                            y: sy,
                            width: Math.max(ex - sx + 1, 1),
                            height: Math.max(ey - sy + 1, 1)
                        };
                    }
                    return;
                }
                case 'view':
                    return;
            }

            if (renderer.worldRenderer.isLowres()) return;
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
            if (screenshotState.state != 'none') {
                if (renderer.overlayRenderer.hoverTile != null) {
                    renderer.overlayRenderer.hoverTile = null;
                    renderer.overlayRenderer.setNeedsRerender();
                }
                return;
            }

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
        <canvas bind:this={worldCanvas}></canvas>
        <canvas bind:this={particleCanvas}></canvas>
        <canvas bind:this={overlayCanvas}></canvas>
    </Controller>
    {#if screenshotState.state == 'view'}
        {@const screenshot = renderer.screenshot({
            ...screenshotState,
            hover: { x: renderer.viewport.x, y: renderer.viewport.y }
        })}
        <div class="z-100">
            <Modal
                onclose={() => (screenshotState = { state: 'none' })}
                class="flex items-center justify-center p-8"
            >
                <div class="rounded-lg bg-white/50 p-4">
                    <ImageDataView image={screenshot} class="max-h-[90vh] max-w-[90vw]" />
                </div>
            </Modal>
        </div>
    {/if}
</div>
