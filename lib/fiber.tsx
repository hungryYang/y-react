interface Props {
    [key: string]: any
}
interface ELEMENT {
    type: string,
    props?: Props
}

interface DeadLine {
    timeRemaining:  () => {}
}

interface NextUnitOfWork {
    dom: HTMLElement | Text,
    props: Props
}

interface DomElement extends NextUnitOfWork{
    parent?: any,
    child?: any,
    sibling?: any,
    alternate?: any,
    effectTag?: string
}

let nextUnitOfWork: DomElement | null = null
let wipRoot: DomElement | null = null
let currentRoot: any = null
let deletions: DomElement[] = []
let wipFiber = null
let hookIndex = null

const isEvent = (key: string) => key.startsWith("on")
/**
 * 对事件属性进行特殊处理
 * */
const isProperty = (key: string) => key !== "children" && !isEvent(key)
const isNew = (prev: Props, next: Props) => (key: string) => prev[key] !== next[key]
const isGone = (prev: Props, next: Props) => (key: string) => !(key in next)

function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(wipRoot?.child)
    currentRoot = wipRoot
    wipRoot = null
}

function updateDom(dom: any, prevProps: Props, nextProps: Props) {

    // 删除或改变event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter((key: string) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
        .forEach((name: string) => {
            const eventType = name.toLowerCase().substring(2)
            dom.removeEventListener(eventType, prevProps[name])
        })

    // 添加event
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach((name: string) => {
            const eventType = name.toLowerCase().substring(2)
            dom.addEventListener(eventType, nextProps[name])
        })

    // 去掉旧属性
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach((name: string) => dom[name] = "")

    // 设置新属性
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach((name: string) => dom[name] = nextProps[name])
}

function commitDeletion(fiber: any, domParent: HTMLElement) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}

function commitWork(fiber: DomElement) {
    if (!fiber) return


    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom
    // const domParent = fiber.parent.dom
    /**
     * 根据effectTag对节点进行处理
     * */
    if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
        domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent)
    } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }
    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function workLoop (deadLine: DeadLine) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        shouldYield = deadLine.timeRemaining() < 1
    }

    /**
     * 如果完成所有工作，把fiber tree提给DOM
     * */
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }
    window.requestIdleCallback(workLoop)
}
/**
 * 递归render引起进程堵塞
 * 浏览器在空闲时间调用函数排队
 * https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback
 * */
window.requestIdleCallback(workLoop)

function reconcileChildren(wipFiber: DomElement, elements: ELEMENT[]) {
    let index = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    let prevSibling: any = null
    while (index < elements.length || oldFiber !== null) {
        const element = elements[index]
        let newFiber = null
        const sameType = oldFiber && element && element.type === oldFiber.type

        /**
         * 同一种类型则更新节点
         * */
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE" // 记录操作
            }
        }

        /**
         * 如果类型不同并且有新元素，则添加节点
         * */
        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT" // 记录操作
            }
        }
        /**
         * 如果类型不同别有旧fiber则删除节点
         * */
        if (oldFiber && !sameType) {
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        /**
         * 如果是第一个子节点，则设置成child，否则为兄弟节点
         * */
        if (index === 0) {
            wipFiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }
        /**
         * prevSibling记录当前链表节点，进入下一循环时设置sibling
         * */
        prevSibling = newFiber
        index++
    }
}

function updateFunctionComponent(fiber: any) {
    wipFiber = fiber
    hookIndex = 0
    // 记录多个hooks调用
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}

function updateHostComponent(fiber:any) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}

function performUnitOfWork (fiber: any): DomElement | null{
    /**
     * 给每一个child创建一个fiber
     * */
    const isFunctionComponent = fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }
    // if (!fiber.dom) {
    //     fiber.dom = createDom(fiber)
    // }

    /**
     * TODO：每次处理元素都会向DOM添加新节点，并且可能被浏览器打断
     *
     *     if (fiber.parent) {
     *         fiber.parent.dom.appendChild(fiber.dom)
     *     }
     * */

    // const elements = fiber.props.children
    // reconcileChildren(fiber, elements)

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

    return null
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
    updateDom(dom, {}, element.props)
    return dom
}

export function useState (initial) {
    const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex]

    const hook = {
        state: oldHook ? oldHook.state: initial,
        queue: []
    }
    // 更新actions
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })
    const setState = action => {
        hook.queue.push(action)
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        }
        nextUnitOfWork = wipRoot
        deletions = []
    }
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

export function fiber (element: ELEMENT, container: HTMLElement | Text) {
    /**
     * 设置根节点fiber tree
     * */
    nextUnitOfWork = wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot // 记录上一阶段fiber
    }
    deletions = []
}
