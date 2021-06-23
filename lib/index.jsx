import React from 'react'
import ReactDOM from 'react-dom'
import { createElement } from "./createElement.tsx";
import { fiber } from "./fiber.tsx";

const YReact = {
    createElement,
    render: fiber
}

function test () {
    console.log(111)
}
/** @jsx YReact.createElement */
const element = (<div id="foo">
    11111
    <p onClick={test}>11111111</p>
</div>)

const container = document.getElementById('root')
YReact.render(element, container)
