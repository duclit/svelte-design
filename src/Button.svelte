<script lang="ts">
    import { generateLayout, Layout } from "./common";

    export let clickHandler = () => {};

    export let fillContainer: boolean = false;
    export let compact: boolean = false;

    export let appearance: 'primary' | 'default' | 'success' | 'danger' | 'warning' | 'link' | 'link-secondary' = 'default';
    export let font: 'monospace' | 'sans-serif' = 'sans-serif';

    export let layout: Layout = {};
</script>

<button 
    class="{compact ? 'compact' : '-default'} {appearance} {font}" 
    style="width: {fillContainer ? '100%' : 'fit-content'}; {generateLayout(layout)}" 
    on:click="{clickHandler}"
>
    <slot></slot>
</button>

<style>
    button.monospace {
        font-family: "Source Code Pro", monospace;
    }

    button.sans-serif {
        font-family: "Segoe UI", sans-serif;
    }

    button {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 4px;

        font-style: normal;
        font-weight: 500;
        font-size: 14px;

        cursor: pointer;
        outline: none;
        border: none;
        user-select: none;   

        width: fit-content;
        height: fit-content;

        border-radius: 4px;
    }

    button.compact {
        padding: 4px 10px;
        line-height: 100%;
    }

    button.-default {
        padding: 8px 14px;
        line-height: 110%;
    }

    button.primary {
        background: #5E5CE6;
        color: white;
    }

    button.default {
        background: rgba(0, 0, 0, 0.05);
        color: black;
    }

    button.success {
        background: #32D74B;
        color: white;
    }

    button.danger {
        background: #FF453A;
        color: white;
    }
    
    button.warning {
        background: #FF9F0A;
        color: black;
    }

    button.primary:hover {
        background: #4D4BBB;
    }

    button.secondary:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    button.success:hover {
        background: #29AF3D;
    }

    button.danger:hover {
        background: #CF382F;
    }
    
    button.warning:hover {
        background: #CF8108;
    }

    button.link {
        background: transparent;
        color: #5E5CE6;
    }

    button.link:hover {
        text-decoration: underline;
    }

    button.link-secondary {
        background: transparent;
        color: #8E8E93;
    }

    button.link-secondary:hover {
        text-decoration: underline;
    }

    button.default:hover {
        background: rgba(0, 0, 0, 0.1);
    }
</style>