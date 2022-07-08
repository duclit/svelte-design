<script lang="ts">
    import { generateLayout, Layout } from "./common";

    export let layout: Layout = {};
    export let font: 'monospace' | 'sans-serif' = 'sans-serif';
    export let value = '';
    export let placeholder = '';
    export let width: string = '300px';

    export let title: string = undefined;
    export let instructions: string = undefined;
</script>

<main style="width: {width}">
    {#if title}
        <h6 class="{font}">{title}</h6>
    {/if}
    <input type="text" style="{generateLayout(layout)}" class="{font}" bind:value="{value}" {placeholder}/>
    {#if instructions}
        <p class="{font}">{instructions}</p>
    {/if}
</main>

<style>
    main {
        width: fit-content;
        height: fit-content;

        display: flex;
        flex-direction: column;
        justify-content: flex-start;

        gap: 4px;
    }

    h6 {
        font-style: normal;
        font-weight: 700;
        font-size: 12.5px;
        line-height: 100%;

        letter-spacing: 0.035em;
        font-feature-settings: 'pnum' on, 'lnum' on;
    }

    p {
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        line-height: 100%;

        letter-spacing: 0.035em;
        font-feature-settings: 'pnum' on, 'lnum' on;

        color: #8E8E93;
    }

    .monospace {
        font-family: 'Source Code Pro', monospace;
    }

    .sans-serif {
        font-family: 'Segoe UI', sans-serif;
    }
    
    input {
        width: 100%;
        height: 37px;

        background: #FFFFFF;

        border: 1px solid #8E8E93;
        border-radius: 4px;

        transition: border 0.2s ease-in,
            background 0.2s ease-in;
        
        outline: none;
        padding-left: 8px;
        
        font-style: normal;
        font-weight: normal;
        font-size: 13px;
        line-height: 150%; 
    }

    input:hover {
        background: #EBEBF0;
    }

    input:focus {
        background: white;
        border: 2px solid #5E5CE6;
    }

    input[type="text"]::placeholder {
        color: #8E8E93;
    }
</style>
