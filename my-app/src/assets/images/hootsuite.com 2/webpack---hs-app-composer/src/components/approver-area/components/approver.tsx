import React from 'react'

import { ListItem } from 'fe-comp-list-item'

import { ApproverProps } from '@/typings/Approver'

const Approver: React.FC<ApproverProps> = ({ approver, onClick }) => {
  return <ListItem item={approver} onClick={onClick} />
}

Approver.displayName = 'Approver'

export default Approver
