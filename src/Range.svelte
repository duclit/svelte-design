<script lang="ts">
    import { generateLayout, Layout } from "./common";

    export let layout: Layout = {};
    export let font: 'monospace' | 'sans-serif' = 'sans-serif';
    export let value = '';
    export let width: string = '300px';
    export let min: number = 0;
    export let max: number = 100;

    export let title: string = undefined;
    export let instructions: string = undefined;
</script>

<main style="width: {width}">
    {#if title}
        <h6 class="{font}">{title}</h6>
    {/if}
    <input type="range" style="{generateLayout(layout)}" bind:value="{value}" min='{min}' max="{max}"/>
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
    
    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;

        margin-top: 6px;
        margin-bottom: 6px;
    }

    ::-webkit-slider-thumb {
        appearance: none;
        cursor: pointer;
        
        width: 18px;
        height: 18px;
        border-radius: 10px;

        background: white;
        margin-top: -6px;

        border: 1px solid #E5E5EA;
        box-shadow: 0px 120px 120px rgba(22, 34, 51, 0.08), 0px 64px 64px rgba(22, 34, 51, 0.12), 0px 32px 32px rgba(22, 34, 51, 0.04), 0px 24px 24px rgba(22, 34, 51, 0.04), 0px 4px 24px rgba(22, 34, 51, 0.04), 0px 4px 4px rgba(22, 34, 51, 0.04);
    }

    ::-webkit-slider-thumb:active {
        border: 1px solid #8E8E93;
    }

    ::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        background: #5E5CE6;

        border-radius: 4px;
    }
</style>
