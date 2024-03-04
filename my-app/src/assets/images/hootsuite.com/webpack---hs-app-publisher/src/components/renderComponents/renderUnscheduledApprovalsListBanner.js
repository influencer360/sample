/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import UnscheduledApprovalsListBanner from '../custom-approval/unscheduled-approvals-list-banner/unscheduled-approvals-list-banner'

const renderUnscheduledApprovalsListBanner = async (props, parentNode) => {
  ReactDOM.render(<UnscheduledApprovalsListBanner {...props} />, parentNode)
}

export default renderUnscheduledApprovalsListBanner
