<script lang="ts">
    import '../app.css';
    import favicon from '$lib/assets/favicon.svg';
    import GitHubCorner from '$lib/GitHubCorner.svelte';

    let { children } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<GitHubCorner url="https://github.com/Vulae/infinite-minesweeper" />

{@render children?.()}
