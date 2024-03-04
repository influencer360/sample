import React from 'react'
import XLight from '@fp-icons/symbol-x-light'
import translation from 'fe-pnc-lib-hs-translation'

import { Content, Root, PillIcon, CloseButton, CloseButtonIcon } from './Pill.styles'

const REMOVE_SCHEDULED_TIME = translation._('Clear scheduled time')

type PillProps = {
  isActive?: boolean
  isPrimary?: boolean
  isClosable?: boolean
  hasError?: boolean
  onClose?: (event?: React.MouseEvent<HTMLElement>) => void
  iconGlyph: unknown
  children?: React.ReactNode
}

const Pill: React.FC<PillProps> = ({
  isActive = false,
  isPrimary = false,
  isClosable = false,
  hasError = false,
  onClose = () => {},
  iconGlyph,
  children,
}) => {
  return (
    <Root
      isActive={isActive}
      aria-haspopup="true"
      role="button"
      tabIndex={0}
      hasError={hasError}
      isPrimary={isPrimary}
      isClosable={isClosable}
    >
      <Content>
        <PillIcon glyph={iconGlyph} hasError={hasError} />
        {children}
      </Content>
      {isClosable && (
        <CloseButton onClick={onClose} aria-label={REMOVE_SCHEDULED_TIME}>
          <CloseButtonIcon glyph={XLight} size="12" aria-hidden="true" />
        </CloseButton>
      )}
    </Root>
  )
}

export default Pill
