<script lang="ts">
    import { generateLayout, Layout, Size, layoutMap } from "./common";
    
    export let gap: Size = 'xl';
    export let direction: 'row' | 'column' = 'column';
    export let layout: Layout = {};
    export let align: ['center' | 'start' | 'end', 'center' | 'start' | 'end'] = ['start', 'start'];
    export let width: string = 'fit-content', height: string = 'fit-content';

    const map = {
        center: 'center',
        start: 'flex-start',
        end: 'flex-end',
        0: 'align-items',
        1: 'justify-content'
    }
    
    const getAlignmentProperties = (): string => {
        let html = '';
        
        for (let i = 0; i < 2; i++) {
            let elem = align[i];
            let value = map[elem];
            let key = map[i];
            
            html += `${key}:${value};`;
        }

        return html
    }
</script>

<div style="display: flex; gap: {layoutMap[gap]}; flex-direction: {direction}; {generateLayout(layout)}; {getAlignmentProperties()}; width: {width}; height: {height};">
    <slot></slot>
</div>