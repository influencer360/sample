/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import FluxComponent from 'hs-nest/lib/components/flux-component'

const renderLinkSettingsManagementArea = async ({
  props,
  memberId,
  localSelectedOrganization,
  parentNode,
  linkSettingsManagementAreaMountPoint,
}) => {
  const { default: LinkSettingsManagementArea } = await import(
    /* webpackChunkName: "LinkSettingsManagementArea" */ '../link-settings/link-settings-management-area/link-settings-management-area'
  )
  const onClose = () => {
    props.onClose()
    ReactDOM.unmountComponentAtNode(document.querySelector(`#${linkSettingsManagementAreaMountPoint}`))
  }
  ReactDOM.render(
    <FluxComponent
      connectToStores={{
        campaigns: store => ({
          campaigns: store.get(),
        }),
        organizations: store => ({
          organizations: store.getSortedByOwner(memberId),
          orgStoreIsInitialized: store.state.initialized,
          selectedOrganization: localSelectedOrganization,
        }),
        presets: store => ({
          presets: store.get(),
        }),
        linkShorteners: store => ({
          linkShorteners: store.get(),
          shortenerConfigs: store.getConfigs(),
        }),
      }}
      flux={props.flux}
    >
      <LinkSettingsManagementArea
        {...props}
        onClose={onClose}
        linkSettingsManagementAreaMountPoint={linkSettingsManagementAreaMountPoint}
      />
    </FluxComponent>,
    parentNode,
  )
}

export default renderLinkSettingsManagementArea
