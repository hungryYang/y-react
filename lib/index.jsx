import React from 'react'
import ReactDOM from 'react-dom'
import { createElement } from "./createElement.tsx";
import { render } from "./render.tsx";

const YReact = {
    createElement,
    render
}

/** @jsx YReact.createElement */
const element = (<div id="foo">
    <span>1</span>
    <span>2</span>
</div>)

const container = document.getElementById('root')
YReact.render(element, container)
