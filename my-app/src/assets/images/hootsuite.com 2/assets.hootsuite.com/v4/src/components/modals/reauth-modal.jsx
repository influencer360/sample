"use strict";

import React from 'react'
import ReauthModal from 'fe-chan-comp-reauth-modal'
import { buildShowDialog } from 'fe-pnc-lib-modal-dialog-controller'

export const showReauthModal = expired => {
  const showDialog = buildShowDialog()
  showDialog(({ close }) => <ReauthModal memberName={hs.memberName} expired={expired} close={close}/>)
}
