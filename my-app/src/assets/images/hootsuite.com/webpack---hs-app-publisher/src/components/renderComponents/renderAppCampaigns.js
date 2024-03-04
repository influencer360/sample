/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import FluxComponent from 'hs-nest/lib/components/flux-component'

const renderAppCampaigns = async (props, parentNode, campaignMountPoint) => {
  const onClose = () => ReactDOM.unmountComponentAtNode(document.querySelector(`#${campaignMountPoint}`))
  const { default: AppCampaigns } = await import(
    /* webpackChunkName: "AppCampaigns" */ '../campaigns/app-campaigns'
  )
  ReactDOM.render(
    <FluxComponent
      connectToStores={{
        campaigns: store => ({
          campaigns: store.get(),
        }),
        member: store => ({
          member: store.get(),
        }),
        presets: store => ({
          presets: store.get(),
        }),
        tags: store => ({
          suggestedTags: store.getSuggestedTags(),
          tags: store.get(),
        }),
      }}
      flux={props.flux}
    >
      <AppCampaigns {...props} onClose={onClose} />
    </FluxComponent>,
    parentNode,
  )
}

export default renderAppCampaigns
