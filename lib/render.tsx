interface ELEMENT{
    type: string,
    props?: any
}

export function render (element: ELEMENT, container: HTMLElement | Text) {
    /**
     * 判断元素type创建dom
     * */
    const dom = element.type === "TEXT_ELEMENT"
                    ? document.createTextNode("")
                    : document.createElement(element.type)

    /**
     * 把节点的props属性除children外附在节点上
     * */
    const isProperty = (key: string) => key !== "children"
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(name => dom[name] = element.props[name])

    /**
     * 递归创建DOM
     * */
    element.props.children.forEach((child: ELEMENT) => render(child, dom))
    container.appendChild(dom)
}
