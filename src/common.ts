export const layoutMap = {
    'sm': '8px',
    'md': '12px',
    'lg': '16px',
    'xl': '32px'
};

export type Size = 'sm' | 'md' | 'lg' | 'xl';

export interface Layout {
    padding?: Size;
    margin?: Size;
};

export const generateLayout = (ly: Layout): string => {
    let returnHtml = '';

    for (const [attr, val] of Object.entries(ly)) 
        returnHtml += `${attr}:${layoutMap[val]};`
    
    return returnHtml
};
