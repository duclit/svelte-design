<script lang="ts">
    import Flexbox from "../Flexbox.svelte";
    
    export let font: 'sans-serif' | 'monospace' = 'sans-serif';
    export let title: string;
</script>

<main class="{font}">
    <h1 class="{font}">{title}</h1>
    <slot></slot>
</main>

<style>
    main {
        width: 300px;
        height: fit-content;

        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 16px;
        gap: 8px;
        
        border: 1px solid #E5E5EA;
        border-radius: 8px;
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