interface ELEMENT {
    type: string,
    props?: any
}

interface DeadLine {
    timeRemaining:  () => {}
}

interface NextUnitOfWork {
    dom: HTMLElement | Text,
    props: {
        children: ELEMENT[]
    }
}

interface DomElement extends NextUnitOfWork{
    parent?: any,
    child?: any,
    sibling?: any
}

let nextUnitOfWork: DomElement | null = null

function workLoop (deadLine: DeadLine) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadLine.timeRemaining() < 1
    }
    window.requestIdleCallback(workLoop)
}
/**
 * 递归render引起进程堵塞
 * 浏览器在空闲时间调用函数排队
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback
 * */
window.requestIdleCallback(workLoop)

function performUnitOfWork (fiber: DomElement): DomElement {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }

    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }

    /**
     * 给每一个child创建一个fiber
     * */
    const elements = fiber.props.children
    let index = 0
    let prevSibling: any = null

    while (index < elements.length) {
        const element = elements[index]

        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null
        }

        /**
         * 如果是第一个子节点，则设置成child，否则为兄弟节点
         * */
        if (index === 0) {
            fiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }
        /**
         * prevSibling记录当前链表节点，进入下一循环时设置sibling
         * */
        prevSibling = newFiber
        index++
    }

    if (fiber.child) {
        return fiber.child
    }

    let nextFiber = fiber

    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }

    return fiber
}

function createDom (element: any) {
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

    return dom
}

export function render (element: ELEMENT, container: HTMLElement | Text) {
    /**
     * 设置根节点fiber tree
     * */
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    }
}
