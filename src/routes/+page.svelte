<script lang="ts">
    import { Game } from '$lib/game/game';
    import { onMount } from 'svelte';
    import GameComponent from './GameComponent.svelte';

    let game: Game | null = $state(null);

    onMount(() => {
        game = new Game();
    });
</script>

<svelte:head>
    <title>Infinite Minesweeper</title>
</svelte:head>

{#if game}
    <GameComponent {game} />
{/if}
