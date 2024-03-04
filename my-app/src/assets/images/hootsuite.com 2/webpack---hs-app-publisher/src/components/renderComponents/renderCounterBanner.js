/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import CounterBanner from '../composer/counter-banner/counter-banner'

const renderCounterBanner = async (props, parentNode) => {
  ReactDOM.render(<CounterBanner {...props} />, parentNode)
}

export default renderCounterBanner
