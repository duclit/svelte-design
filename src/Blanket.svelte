<script lang="ts">
    export let clickHandler: () => void = () => {};
</script>

<main on:click|self={clickHandler}>
    <slot></slot>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        position: absolute;
        top: 0px;
        left: 0px;
        width: 100vw;
        height: 100vh;

        background: rgba(0, 0, 0, 0.1);
    }
</style>