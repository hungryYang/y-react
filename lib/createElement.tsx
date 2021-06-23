export function createElement(type: string, props: { [key: string]: any, children?: any }, ...children : any[]) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child :createTextElement(child))
        }
    }
}

function createTextElement(text: string | number) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}
