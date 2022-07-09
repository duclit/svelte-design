<script lang="ts">
    import type { SvelteComponentTyped } from "svelte/internal";

    interface TabNode {
        data: () => object,
        name: string,
        view: Partial<SvelteComponentTyped>
    };
    
    export let tabs: TabNode[];
    export let width: string;
    export let height: string;

    let tabViews: Record<string, Partial<SvelteComponentTyped>> = {};
    let tabData: Record<string, () => object> = {};

    let selected = tabs[0].name;
    let currentView = tabs[0].view;
    let currentViewData = tabs[0].data;

    tabs.map((value) => {
        tabViews[value.name] = value.view;
        tabData[value.name] = value.data;
    });

    const updateView = () => {        
        currentView = tabViews[selected];
        currentViewData = tabData[selected];
        console.log(currentViewData, currentViewData())
    };

    $: selected, updateView();
</script>

<main class="container">
    <main style="width: {width};">
        {#each tabs as tab} 
            <button class:active={selected === tab.name} on:click={() => {selected = tab.name}}>{tab.name}</button>
        {/each}
        <div class="line"></div>
    </main>

    <div style="width: {width}; height: {height};">
        <svelte:component this={currentView} data={currentViewData()}/>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: row;

        height: fit-content;
    }

    main.container {
        flex-direction: column;
        gap: 16px;
    }
    
    button {
        height: 32px;
        width: fit-content;

        font-style: normal;
        font-weight: 500;
        font-size: 14px;

        border: none;
        border-bottom: 2px solid #F2F2F7;
        color: black;
        opacity: 70%;

        padding-left: 8px;
        padding-right: 8px;

        transition: opacity 0.2s ease-in;

        background: transparent;
        cursor: pointer;
        outline: none;
    }

    button:hover:not(.active) {
        opacity: 100%;
        color: #5E5CE6;
    }

    button.active {
        font-weight: 500;
        border-bottom: 2px solid #5E5CE6;
        color: #5E5CE6;
        opacity: 100%;
    }

    div.line {
        height: 2px;
        flex-grow: 100;
        background: #F2F2F7;
        margin-top: auto;
    }
</style>
