<script lang="ts">
    import { Game } from '$lib/game/game';
    import { onMount } from 'svelte';
    import GameComponent from './GameComponent.svelte';
    import { spiralIter } from '$lib/util';
    import { NEARBY_NONE } from '$lib/game/world';
    import {
        LucideChevronLeft,
        LucideChevronRight,
        LucideImage,
        LucideInfo,
        LucideSettings,
        LucideSkull
    } from '@lucide/svelte';
    import Modal from './Modal.svelte';
    import { EventListener } from '$lib/eventDispatcher';

    let game: Game | null = $state(null);

    let beginScreenshot: () => void = $state(() => {
        throw new Error('WTFFF THIS ERROR SHOULD NOT BE POSSIBLE');
    });

    let deathListener: EventListener;
    let numDeaths: number = $state(0);

    onMount(() => {
        game = new Game();

        deathListener = game.world.addEventListener(
            'death',
            () => (numDeaths = game?.world.deaths.size ?? 0)
        );

        // Auto-reveal nearest tile to (0, 0) that has 0 nearby mines.
        for (const { x, y } of spiralIter(0, 0)) {
            const tile = game.world.getTile(x, y);
            if (tile.numMines() == 0 && tile.getNearbyMines(game.world) == NEARBY_NONE) {
                game.world.revealTile(x, y);
                break;
            }
        }

        () => {
            deathListener.destroy();
        };
    });

    let tabVisible: 'none' | 'info' | 'settings' = $state('info');

    const infoTabBiomes: {
        name: string;
        description: string;
        image: string;
    }[] = [
        {
            name: 'Vanilla',
            description: 'The normal rules of Minesweeper',
            image: './preview_biome_vanilla.png'
        },
        {
            name: 'Chocolate',
            description: 'The normal rules of Minesweeper',
            image: './preview_biome_chocolate.png'
        },
        {
            name: 'Blueberry',
            description: 'Each tile may have up to 3 mines',
            image: './preview_biome_blueberry.png'
        },
        {
            name: 'Strawberry',
            description: 'Each tile has its own mine search pattern',
            image: './preview_biome_strawberry.png'
        },
        {
            name: 'Waffle',
            description: 'Dark sections have 3 mines, and light sections have 1 mine',
            image: './preview_biome_waffle.png'
        },
        {
            name: 'Stroopwafel',
            description: 'Dark sections have 9 mines, and light sections have 1 mine',
            image: './preview_biome_stroopwafel.png'
        },
        {
            name: 'Cookies & Cream',
            description: 'Tiles may have anti-mine that counts as -1 mines',
            image: './preview_biome_cookies_and_cream.png'
        }
    ];
    let infoTabBiomeIndex: number = $state(0);
</script>

<svelte:head>
    <title>Infinite Minesweeper</title>
</svelte:head>

{#snippet infoModal()}
    {@const infoTabBiome = infoTabBiomes[infoTabBiomeIndex]}

    <Modal onclose={() => (tabVisible = 'none')} class="flex h-full justify-center px-16">
        <div
            class="flex min-h-full flex-col items-center justify-around gap-4 bg-white/50 py-8 drop-shadow-2xl drop-shadow-black backdrop-blur-xl"
        >
            <div class="w-full px-10">
                <div
                    class="flex w-full flex-col items-center gap-2 rounded-md bg-zinc-100 px-8 py-2"
                >
                    <h1 class="text-2xl font-bold">Infinite Minesweeper</h1>
                    <span class="max-w-96 text-center text-lg">
                        Infinite Minesweeper with biomes that change the rules of the game
                    </span>
                </div>
            </div>
            <div class="grid h-64 w-full" style:grid-template-columns="auto 1fr auto">
                <button
                    class="cursor-pointer px-2 hover:[&>*]:-translate-x-1"
                    onclick={() => {
                        infoTabBiomeIndex--;
                        if (infoTabBiomeIndex < 0) {
                            infoTabBiomeIndex = infoTabBiomes.length - 1;
                        }
                    }}
                >
                    <LucideChevronLeft class="transition-transform" />
                </button>
                <div class="grid w-128 grid-cols-2 overflow-clip rounded-md">
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img
                        src={infoTabBiome.image}
                        class="h-full"
                        style:image-rendering="pixelated"
                    />
                    <section class="bg-zinc-100 px-4 py-2">
                        <h1 class="text-2xl font-bold">{infoTabBiome.name}</h1>
                        <p class="text-lg">{infoTabBiome.description}</p>
                    </section>
                </div>
                <button
                    class="cursor-pointer px-2 hover:[&>*]:translate-x-1"
                    onclick={() => {
                        infoTabBiomeIndex++;
                        if (infoTabBiomeIndex > infoTabBiomes.length - 1) {
                            infoTabBiomeIndex = 0;
                        }
                    }}
                >
                    <LucideChevronRight class="transition-transform" />
                </button>
            </div>
            <div class="w-full px-10">
                <button
                    class="h-16 w-full cursor-pointer rounded-md bg-zinc-100 text-2xl font-bold transition-colors hover:bg-zinc-200"
                    onclick={() => (tabVisible = 'none')}>PLAY</button
                >
            </div>
        </div>
    </Modal>
{/snippet}

{#if game}
    <div class="force-overlap h-screen w-full">
        <div>
            <GameComponent {game} bind:beginScreenshot />
        </div>
        <div class="pointer-events-none flex items-center justify-end p-3">
            <div
                class="pointer-events-auto flex flex-col items-center gap-2 rounded-full bg-white/30 stroke-[3] px-2 py-3 font-bold text-white shadow-lg backdrop-blur-md"
            >
                <button
                    class="cursor-pointer"
                    title="Information"
                    onclick={() => (tabVisible = 'info')}
                >
                    <LucideInfo />
                </button>
                <!-- <button class="cursor-pointer" title="Settings">
                    <LucideSettings />
                </button> -->
                <button class="cursor-pointer" title="Screenshot" onclick={() => beginScreenshot()}>
                    <LucideImage />
                </button>
                <div class="h-0.5 w-full rounded-full bg-white"></div>
                <div class="flex flex-col items-center justify-center" title="Deaths">
                    <LucideSkull />
                    <span>{numDeaths}</span>
                </div>
            </div>
        </div>
        {#if tabVisible == 'info'}
            {@render infoModal()}
        {/if}
    </div>
{:else}
    <div class="flex h-screen w-full items-center justify-center">
        <h1 class="p-4 text-center text-4xl font-bold text-white">Please enable JavaScript</h1>
    </div>
{/if}
