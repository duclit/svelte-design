<script lang="ts">
    import { fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import type { Size } from "../common";

    export let size: Size = 'md';
    export let font: 'sans-serif' | 'monospace' = 'sans-serif';
    export let title: string;
</script>

<main class="{font} {size}" transition:fade={{ delay: 0, duration: 200, easing: quintOut }}>
    <h1 class="{font}">{title}</h1>
    <slot></slot>
</main>

<style>
    main {
        height: fit-content;

        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 16px;
        gap: 8px;
        
        border: 1px solid #E5E5EA;
        border-radius: 8px;

        background: white;
    }

    .sm {
        width: 300px;
    }

    .md {
        width: 450px;
    }

    .lg {
        width: 600px;
    }

    .xl {
        width: 800px;
    }

    .monospace {
        font-family: 'Source Code Pro', monospace;
    }

    .sans-serif {
        font-family: 'Segoe UI', sans-serif;
    }

    h1 {
        font-style: normal;
        font-weight: 600;
        font-size: 16px;
        line-height: 24px;
    }
</style>
