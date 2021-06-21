import React from 'react'
import ReactDOM from 'react-dom'
import {createElement} from "./createElement.tsx";
const YReact = {
    createElement
}

/** @jsx YReact.createElement */
const element = (<div id="foo">
    <a>bar</a>
    test
</div>)

const container = document.getElementById('root')
ReactDOM.render(element, container)
