<script lang="ts">
    import '../app.css';
    import favicon from '$lib/assets/favicon.png';
    import GitHubCorner from '$lib/GitHubCorner.svelte';
    import type { Snippet } from 'svelte';

    let {
        children
    }: {
        children?: Snippet<[]>;
    } = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<GitHubCorner url="https://github.com/Vulae/infinite-minesweeper" />

{@render children?.()}
