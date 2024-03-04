import React from 'react'

import styled from 'styled-components'
import EmblemTrash from '@fp-icons/emblem-trash'
import Icon from '@fp-icons/icon-base'
import { Button, ICON, SIZE_28 } from 'fe-comp-button'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

const CloseButton = withHsTheme(styled(Button)`
  position: absolute;
  z-index: 1;
  top: ${() => getThemeValue(t => t.spacing.spacing8)};
  right: ${() => getThemeValue(t => t.spacing.spacing8)};
`)
CloseButton.displayName = 'LinkPreviewCloseButton'

interface ClosePreviewButtonProps {
  onClick(): void
}

const ClosePreviewButton = ({ onClick }: ClosePreviewButtonProps) => (
  <CloseButton type={ICON} height={SIZE_28} onClick={onClick} data-testid="LinkPreviewCloseButton">
    <Icon glyph={EmblemTrash} />
  </CloseButton>
)

ClosePreviewButton.defaultProps = {
  onClick: () => {},
}

export default ClosePreviewButton
