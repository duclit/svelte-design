<script lang="ts">
    import Flexbox from "../Flexbox.svelte";
</script>

<Flexbox width="100%" align={['center', 'end']} gap="sm" direction="row">
    <slot></slot>
</Flexbox>