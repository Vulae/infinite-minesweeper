<script lang="ts">
    import type { Game } from '$lib/game/game';
    import { Renderer } from '$lib/game/renderer/renderer';
    import { onMount } from 'svelte';
    import Controller from './Controller.svelte';
    import { Viewport } from '$lib/game/viewport';
    import Modal from './Modal.svelte';
    import ImageDataView from './ImageDataView.svelte';
    import { LucideCamera } from '@lucide/svelte';
    import { SCREENSHOT_MAX_SIZE } from '$lib/game/consts';

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

    let hoverTile: { x: number; y: number } | null = $state(null);

    $effect(() => {
        renderer.overlayRenderer.hoverTile = hoverTile;
    });

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
        switch (screenshotState.state) {
            case 'capture_pos1': {
                renderer.overlayRenderer.screenshotState = { state: 'pos1' };
                renderer.overlayRenderer.setNeedsRerender();
                break;
            }
            case 'capture_pos2': {
                renderer.overlayRenderer.screenshotState = {
                    state: 'pos2',
                    x: screenshotState.x,
                    y: screenshotState.y
                };
                renderer.overlayRenderer.setNeedsRerender();
                break;
            }
            default: {
                renderer.overlayRenderer.screenshotState = null;
                renderer.overlayRenderer.setNeedsRerender();
                break;
            }
        }
    });

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

            game.saveManager.save();
        };
    });
</script>

<svelte:window
    onbeforeunload={() => {
        game.saveManager.save();
    }}
/>

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
                            width: Math.min(ex - sx + 1, SCREENSHOT_MAX_SIZE),
                            height: Math.min(ey - sy + 1, SCREENSHOT_MAX_SIZE)
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
            let lastHoverTileX: number | null = null;
            let lastHoverTileY: number | null = null;
            if (hoverTile != null) {
                lastHoverTileX = hoverTile.x;
                lastHoverTileY = hoverTile.y;
            }
            if (!pos) {
                hoverTile = null;
            } else {
                const worldPos = renderer.viewport.canvasPos(worldCanvas, pos.x, pos.y, true);
                hoverTile = worldPos;
            }
            if (
                (hoverTile ?? { x: null }).x !== lastHoverTileX ||
                (hoverTile ?? { y: null }).y !== lastHoverTileY
            ) {
                renderer.overlayRenderer.setNeedsRerender();
            }
        }}
    >
        <canvas bind:this={worldCanvas}></canvas>
        <canvas bind:this={particleCanvas}></canvas>
        <canvas bind:this={overlayCanvas}></canvas>
    </Controller>
    {#if screenshotState.state == 'capture_pos1' || screenshotState.state == 'capture_pos2'}
        <div class="pointer-events-none p-4">
            <fieldset
                class="h-full w-full rounded-md border-8 border-white"
                style:filter="drop-shadow(2px 3px 2px black)"
            >
                <legend
                    class="ml-16 flex items-center gap-4 rounded-lg bg-white px-4 font-bold text-black"
                >
                    <LucideCamera />
                    <span>
                        {#if screenshotState.state == 'capture_pos1'}
                            {#if hoverTile}
                                At {hoverTile.x}, {hoverTile.y}
                            {/if}
                        {:else if screenshotState.state == 'capture_pos2'}
                            {#if hoverTile}
                                {@const minX = Math.min(screenshotState.x, hoverTile.x)}
                                {@const minY = Math.min(screenshotState.y, hoverTile.y)}
                                {@const maxX = Math.max(screenshotState.x, hoverTile.x)}
                                {@const maxY = Math.max(screenshotState.y, hoverTile.y)}
                                {@const width = Math.min(maxX - minX + 1, SCREENSHOT_MAX_SIZE)}
                                {@const height = Math.min(maxY - minY + 1, SCREENSHOT_MAX_SIZE)}
                                At {minX}, {minY} with size {width}x{height}
                            {:else}
                                At {screenshotState.x}, {screenshotState.y}
                            {/if}
                        {/if}
                    </span>
                </legend>
            </fieldset>
        </div>
    {:else if screenshotState.state == 'view'}
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
