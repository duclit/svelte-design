export type Color = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'indigo' | 'purple' | 'pink' | 'grey1' | 'grey2' | 'grey3' | 'grey4' | 'grey5' | 'grey6' | 'light1' | 'light2' | 'light3' | 'light4' | 'white' | 'black';
export type Shadow = 'sm' | 'md' | 'lg' | 'xl';

const proxyHandler = {
    get: (target, obj) => obj,
};

const ReturnSelf = new Proxy({}, proxyHandler);

export const colorMap = {
    'red': '#FF453A', 
    'orange': '#FF9F0A', 
    'yellow': '#FFD60A', 
    'green': '#32D74B', 
    'teal': '#64D2FF', 
    'blue': '#0A84FF', 
    'indigo': '#5E5CE6', 
    'purple': '#BF5AF2', 
    'pink': '#FF2D55', 
    'grey1': '#8E8E93', 
    'grey2': '#636366', 
    'grey3': '#48484A', 
    'grey4': '#3A3A3C', 
    'grey5': '#2C2C2E', 
    'grey6': '#1C1C1E', 
    'light1': '#EBEBF0', 
    'light2': '#D8D8DC', 
    'light3': '#BCBCC0', 
    'light4': '#AEAEB2', 
    'white': 'white', 
    'black': 'black'
};

const shadowMap = {
    'sm': '0px 8px 16px -4px rgba(22, 34, 51, 0.08)',
    'md': '0px 4px 8px -4px rgba(22, 34, 51, 0.08), 0px 16px 24px rgba(22, 34, 51, 0.08)',
    'lg': '0px 4px 12px -4px rgba(22, 34, 51, 0.12), 0px 16px 32px rgba(22, 34, 51, 0.16)',
    'xl': '0px 120px 120px rgba(22, 34, 51, 0.08), 0px 64px 64px rgba(22, 34, 51, 0.12), 0px 32px 32px rgba(22, 34, 51, 0.04), 0px 24px 24px rgba(22, 34, 51, 0.04), 0px 4px 24px rgba(22, 34, 51, 0.04), 0px 4px 4px rgba(22, 34, 51, 0.04)'
};

const attributeProcessorMap = {
    'background': colorMap,
    'foreground': colorMap,
    'fontFamily': { 'sans-serif': 'Segoe UI', 'monospace': 'Source Code Pro' },
    'shadow': shadowMap,
    'dropShadow': shadowMap
};

const attributeCSSNameMap = {
    'background': 'background-color',
    'foreground': 'color',
    'fontFamily': 'font-family',
    'shadow': 'box-shadow',
    'dropShadow': 'drop-shadow'
};

export interface Style {
    background?: Color;
    foreground?: Color;
    fontFamily?: 'sans-serif' | 'monospace';
    shadow?: Shadow;
    dropShadow?: Shadow;
};

export interface Transform {
    width?: string,
    height?: string,
    padding?: string,
    margin?: string;
};

export const generateStyle = (style: Style): string => {
    let styleHTML = '';
    
    for (const [attribute, value] of Object.entries(style))
        styleHTML += `${attributeCSSNameMap[attribute]}:${attributeProcessorMap[attribute][value]};`;

    return styleHTML;
};

export const generateTransformStyle = (style: Transform): string => {
    let styleHTML = '';

    for (const [attribute, value] of Object.entries(style))
        styleHTML += `${attribute}:${value};`;
    
    return styleHTML;
};

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