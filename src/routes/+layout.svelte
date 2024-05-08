<script lang="ts">
    import GithubCorner from "$components/GithubCorner.svelte";
    import "../style.scss";
    import * as gitinfo from "../gitinfo";
    import { onMount } from "svelte";

    onMount(() => {
        let messages: string[] = [];
        let styles: string[] = [];
        function newMessage(message: string): void {
            messages.push(message);
            styles.push(
                styles.length % 2 == 0 ?
                    `padding: 15px 20px; background-color: #3C2F55;` :
                    `padding: 15px 20px; background-color: #21222C;`
            );
        }

        newMessage(`https://github.com/Vulae/infinite-minesweeper`);

        const git = Object.fromEntries(Object.entries(gitinfo).filter(([key, value]) => key != 'PLACEHOLDER'));
        if(typeof git.HASH == 'string') {
            newMessage(`${git.HASH}`);
        }

        console.log(`\n${messages.map(m => `%c${m}`).join('')}%c \n`, ...styles, 'background-color: transparent');
    });

</script>

<svelte:head>
    <title>Infinite Minesweeper</title>
    <meta name="description" content="Play Infinite Minesweeper with many biomes that change the rules of the game.">
    <meta name="keywords" content="minesweeper,infinite minesweeper,procedural,procedural minesweeper,minesweeper twist,minesweeper biomes,minesweeper style game">
</svelte:head>

<slot />

<GithubCorner url={"https://github.com/Vulae/infinite-minesweeper"} newTab={true} />
