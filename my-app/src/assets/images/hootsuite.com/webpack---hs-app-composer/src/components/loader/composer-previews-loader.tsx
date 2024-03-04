import React from 'react'

import { noop } from 'lodash'
import styled from 'styled-components'
import { getThemeValue } from 'fe-lib-theme'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { getSelectedMessage, getState as getComposerMessageState } from 'fe-pnc-data-composer-message'
import { getStore as getMessagePreviewsStore } from 'fe-pnc-data-message-previews'
import type { PreviewsState } from 'fe-pnc-data-message-previews'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { observeStore } from 'fe-pnc-lib-store-observer'
import Message from '@/models/message'
import ComposerUtils from '@/utils/composer-utils'

import { Loader as LoaderBase } from './'

const PREVIEW_LOADER_TRANSITION = 250
const PREVIEW_LOADER_MAX_WIDTH = '650px'

const PreviewLoaderContainer = styled.div`
  .previewLoader-enter {
    opacity: 0.01;
  }

  .previewLoader-enter.previewLoader-enter-active {
    opacity: 1;
    transition: opacity ${PREVIEW_LOADER_TRANSITION}ms ease-in;
  }

  .previewLoader-leave {
    opacity: 1;
  }

  .previewLoader-leave.previewLoader-leave-active {
    opacity: 0.01;
    transition: opacity ${PREVIEW_LOADER_TRANSITION}ms ease-in;
  }
`

PreviewLoaderContainer.displayName = 'PreviewLoaderContainer'

const Loader = bouncingBarColour => (
  <LoaderBase
    backgroundColour="transparent"
    bouncingBarColour={bouncingBarColour}
    width="50%"
    maxWidth={PREVIEW_LOADER_MAX_WIDTH}
  />
)

interface ComposerPreviewsLoaderState {
  isFetchingPreview: boolean
}
class ComposerPreviewsLoader extends React.PureComponent<null, ComposerPreviewsLoaderState> {
  static displayName = 'ComposerPreviewsLoader'

  observerUnsubscribe: () => void

  constructor(props) {
    super(props)

    this.observerUnsubscribe = noop

    this.state = {
      isFetchingPreview: false,
    }
  }

  componentDidMount() {
    this.observerUnsubscribe = observeStore(
      getMessagePreviewsStore(),
      (isFetchingPreview: boolean) => this.setState({ isFetchingPreview }),
      (state: PreviewsState) => state.isFetchingPreview,
    )
  }

  componentWillUnmount() {
    if (typeof this.observerUnsubscribe === 'function') {
      this.observerUnsubscribe()
    }
  }

  getBouncingBarColour() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    let bouncingBarColour = getThemeValue(t => t.colors.darkGrey)
    if (isFeatureEnabledOrBeta('PUB_27622_IG_REEL_PREVIEW')) {
      if (
        selectedMessageForEdit?.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM &&
        ComposerUtils.isInstagramReel(selectedMessageForEdit?.postType)
      ) {
        bouncingBarColour = getThemeValue(t => t.colors.lightGrey10)
      }
    }
    return bouncingBarColour
  }

  getSelectedMessageForEdit = (): Message => getSelectedMessage(getComposerMessageState())

  render() {
    return (
      <PreviewLoaderContainer key="previewLoader" data-testid="PreviewLoaderContainer">
        {this.state.isFetchingPreview ? Loader(this.getBouncingBarColour()) : null}
      </PreviewLoaderContainer>
    )
  }
}

export default ComposerPreviewsLoader
