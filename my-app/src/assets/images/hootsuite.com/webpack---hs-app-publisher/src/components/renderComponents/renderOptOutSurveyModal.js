/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import OptOutSurveyModal from '../opt-out-survey-modal/opt-out-survey-modal'

const onClose = (containerId, e) => {
  if (e) {
    e.stopPropagation()
  }
  ReactDOM.unmountComponentAtNode(document.querySelector(`#${containerId}`))
}

const onOptOut = (optOutFn, containerId, e) => {
  optOutFn()
  onClose(containerId, e)
}

const renderOptOutSurveyModal = async (props, parentNode) => {
  ReactDOM.render(
    <OptOutSurveyModal
      {...props}
      onClose={e => onClose(props.containerId, e)}
      onOptOut={e => onOptOut(props.optOutFn, props.containerId, e)}
    />,
    parentNode,
  )
}

export default renderOptOutSurveyModal
