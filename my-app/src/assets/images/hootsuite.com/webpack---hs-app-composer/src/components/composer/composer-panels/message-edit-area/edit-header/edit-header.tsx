/**
 * @preventMunge
 */

import React from 'react'

import styled from 'styled-components'
import { Button, STANDARD } from 'fe-comp-button'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import translation from 'fe-pnc-lib-hs-translation'

import Constants from '@/constants/constants'

const EDIT_MESSAGE = translation._('Edit post')
const PREVIEW = translation._('Preview')
const EDIT = translation._('Edit')
const PREVIEW_ARIA_LABEL = translation._('Show preview')

export const Wrapper = withHsTheme(styled.div`
  flex: 0 0 64px;
  align-items: center;
  display: flex;
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing32)};
`)

export const Heading = withHsTheme(styled.h2`
  flex: 1 1 auto;
  font-weight: ${() => getThemeValue(t => t.typography.subSectionTitle.weight)};
  font-size: ${() => getThemeValue(t => t.typography.subSectionTitle.size)};
  margin: 0;
`)
Heading.displayName = 'Heading'

interface EditHeaderProps {
  mode: typeof Constants.BULK_COMPOSER_EDIT_MODES.EDIT | typeof Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW
  onModeChange?(): void
}

/**
 * Header of the edit panel for the bulk composer
 */
export default class EditHeader extends React.Component<EditHeaderProps> {
  static displayName = 'Edit Header'

  static defaultProps = {
    onModeChange: () => {},
  }

  render() {
    const { mode, onModeChange } = this.props
    const isEditMode = mode === Constants.BULK_COMPOSER_EDIT_MODES.EDIT
    const buttonAriaLabel = isEditMode ? PREVIEW_ARIA_LABEL : EDIT_MESSAGE
    return (
      <Wrapper>
        <Heading>{isEditMode ? EDIT_MESSAGE : PREVIEW}</Heading>
        <Button aria-label={buttonAriaLabel} onClick={onModeChange} type={STANDARD}>
          {isEditMode ? PREVIEW : EDIT}
        </Button>
      </Wrapper>
    )
  }
}
