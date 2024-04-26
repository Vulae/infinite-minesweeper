<script lang="ts">
    import GithubCorner from "$components/GithubCorner.svelte";
    import "../style.scss";

</script>

<svelte:head>
    <title>Infinite Minesweeper</title>
    <meta name="description" content="Play Infinite Minesweeper with many biomes that change the rules of the game.">
    <meta name="keywords" content="minesweeper,infinite minesweeper,procedural,procedural minesweeper,minesweeper twist,minesweeper biomes,minesweeper style game">
</svelte:head>

<slot />

<GithubCorner url={"https://github.com/Vulae/infinite-minesweeper"} newTab={true} />
