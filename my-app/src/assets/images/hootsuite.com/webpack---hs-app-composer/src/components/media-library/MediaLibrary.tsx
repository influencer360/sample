import React, { memo, useEffect, useRef } from 'react'
import styled from 'styled-components'

import { BouncingBars } from 'fe-comp-loader'
import { getApp } from 'fe-lib-async-app'

import type { AttachmentData } from 'fe-pnc-data-composer-message'

type MediaLibraryApp = {
  mountFullScreen: (node: HTMLElement, props: Record<string, unknown>) => void
  mountSidePanel: (node: HTMLElement, props: Record<string, unknown>) => void
  unmount: (node: HTMLElement) => void
}

const APP_NAME = 'hs-app-contentlab'

const MediaLibraryWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

type MediaLibraryProps = {
  onAddAttachment: (attachment: AttachmentData, isUploadRequired: boolean, currentSource?: string) => void
  onClose: () => void
  onExitComposer: () => void
  onMinimize: () => void
  selectedOrganization?: any
  showCloseOption?: boolean
  supportDragAndDrop?: boolean
}

const MediaLibrary: React.FC<MediaLibraryProps> = memo(
  ({
    onAddAttachment,
    onClose,
    onExitComposer,
    onMinimize,
    selectedOrganization,
    showCloseOption,
    supportDragAndDrop,
  }) => {
    const wrapperRef = useRef(null)

    useEffect(() => {
      let mediaLibraryApp: MediaLibraryApp
      let node: HTMLDivElement

      getApp<MediaLibraryApp>(APP_NAME).then((app: MediaLibraryApp) => {
        if (wrapperRef?.current) {
          node = wrapperRef.current
          mediaLibraryApp = app
          mediaLibraryApp.mountSidePanel(node, {
            onAddAttachment,
            onClose,
            onExitComposer,
            onMinimize,
            selectedOrganization,
            showCloseOption,
            supportDragAndDrop,
          })
        }
      })

      return () => {
        if (mediaLibraryApp) {
          mediaLibraryApp.unmount(node)
        }
      }
    })

    return (
      <MediaLibraryWrapper ref={wrapperRef} data-testid="media-library-wrapper">
        <BouncingBars />
      </MediaLibraryWrapper>
    )
  },
)

export default MediaLibrary
