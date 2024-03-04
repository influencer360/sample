/** @format */
import React from 'react'
import { buildShowDialog } from 'fe-pnc-lib-modal-dialog-controller'

const renderLinkSettingsDialog = async data => {
  const { default: LinkSettingsDialog } = await import(
    /* webpackChunkName: "LinkSettingsDialog" */ '../link-settings/link-settings-dialog'
  )

  const showDialog = buildShowDialog()
  showDialog(({ close }) => <LinkSettingsDialog close={close} {...data} />)
}

export default renderLinkSettingsDialog
