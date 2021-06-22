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
    <a>bar</a>
    test
</div>)

const container = document.getElementById('root')
YReact.render(element, container)
