<script lang="ts">
    import { generateLayout, Layout } from "./common";
    
    export let appearance: 'success' | 'error' | 'primary' | 'important' | 'default' = 'default';
    export let label: string;
    export let font: 'monospace' | 'sans-serif' = 'sans-serif';

    export let layout: Layout = {};
</script>

<div class="{appearance} {font}" style="{generateLayout(layout)}" >
    {label}
</div>

<style>
    div.monospace {
        font-family: "Source Code Pro", monospace;
    }

    div.sans-serif {
        font-family: "Segoe UI", sans-serif;
    }
    
    div {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 1px 5px;

        border-radius: 75px;

        font-style: normal;
        font-weight: 500;
        font-size: 10px;
        line-height: 150%;
        /* identical to box height, or 15px */

        letter-spacing: 0.1em;
        font-feature-settings: 'pnum' on, 'lnum' on;

        width: fit-content;
        height: fit-content;
    }

    div.success {
        color: #368523;
        background: rgba(50, 215, 75, 0.4);
    }

    div.error {
        color: #8B1912;
        background: rgba(255, 69, 58, 0.4);
    }

    div.primary {
        color: white;
        background: #5E5CE6;
    }

    div.important {
        color: white;
        background: #FF453A;
    }

    div.default {
        color: black;
        background: #BCBCC0;
    }
</style>
