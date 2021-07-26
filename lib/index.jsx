import React from 'react'
import ReactDOM from 'react-dom'
import { createElement } from "./createElement.tsx";
import { fiber, useState } from "./fiber.tsx";

const YReact = {
    createElement,
    render: fiber,
    useState
}

function test () {
    console.log(111)
}
/** @jsx YReact.createElement */
// const element = (<div id="foo">
//     11111
//     <p onClick={test}>11111111</p>
// </div>)
//
// function App (props) {
//     return <h1>Hi {props.name}</h1>
// }
// const element = <App name="foo" />
function Counter() {
    const [state, setState] = YReact.useState(1)
    return (
        <h1 onClick={() => setState(c => c + 1)}>
            Count: {state}
        </h1>
    )
}
const element = <Counter />
const container = document.getElementById('root')
YReact.render(element, container)
