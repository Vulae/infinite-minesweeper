<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        children,
        onclose = () => {},
        class: _class = ''
    }: {
        children: Snippet<[]>;
        onclose?: () => unknown;
        class?: string;
    } = $props();
</script>

<div class="force-overlap">
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button class="modal-fade-in cursor-pointer" onclick={() => onclose()}></button>
    <div class="pointer-events-none z-1 {_class}">
        <div class="pointer-events-auto contents">
            {@render children()}
        </div>
    </div>
</div>

<style>
    .modal-fade-in {
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        animation: modal-fade-in-blur-anim forwards 500ms ease-in-out;
    }

    @keyframes modal-fade-in-blur-anim {
        0% {
            opacity: 0%;
            backdrop-filter: blur(0px);
        }
        50% {
            opacity: 100%;
        }
        100% {
            backdrop-filter: blur(8px);
        }
    }
</style>
