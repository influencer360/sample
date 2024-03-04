/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import FluxComponent from 'hs-nest/lib/components/flux-component'
import CustomApproval from '../custom-approval/custom-approval'

const renderCustomApproval = async (props, ownerId, parentNode) => {
  ReactDOM.render(
    <FluxComponent
      connectToStores={{
        approver: store => ({
          allAssignees: store.getApproversByOrganizationId(ownerId),
          approvers: store.getApproversByOrganizationId(ownerId),
        }),
      }}
      flux={props.flux}
    >
      <CustomApproval {...props} />
    </FluxComponent>,
    parentNode,
  )
}

export default renderCustomApproval
