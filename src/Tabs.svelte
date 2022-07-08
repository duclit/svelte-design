<script lang="ts">
    import type { SvelteComponentTyped } from "svelte/internal";

    interface TabNode {
        data: () => object,
        name: string,
        view: SvelteComponentTyped 
    };
    
    export let tabs: TabNode[];

    let tabViews: Record<string, SvelteComponentTyped>;
    let selected = tabs[0].name;
    let currentView = tabs[0].view;
    let currentViewData = tabs[0].data;

    tabs.map((value) => {
        tabViews[value.name] = value.view;
    });

    const updateView = () => {
        currentView = tabViews[selected];
    };

    $: selected, updateView();
</script>

<main>
    {#each tabs as tab} 
        <button class:active={selected === tab.name} on:click={() => {selected = tab.name}}>{tab}</button>
    {/each}

    <div>
        <svelte:component this={currentView} data={currentViewData()}/>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: row;
        gap: 16px;

        width: fit-content;
        height: fit-content;
    }
    
    button {
        height: 32px;
        width: fit-content;

        font-style: normal;
        font-weight: 500;
        font-size: 14px;

        border-bottom: 2px solid transparent;
        color: black;
        opacity: 70%;

        transition: opacity 0.2s ease-in;

        background: transparent;
        cursor: pointer;
        border: none;
        outline: none;
    }

    button:hover:not(.active) {
        opacity: 90%;
    }

    button.active {
        font-weight: 500;
        border-bottom: 2px solid #5E5CE6;
        color: #5E5CE6;
        opacity: 100%;
    }

    div {
        width: 700px;
        height: 500px;
    }
</style>