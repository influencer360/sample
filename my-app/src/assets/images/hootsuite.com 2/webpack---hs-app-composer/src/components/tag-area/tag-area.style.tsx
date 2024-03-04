import React from 'react'

import styled from 'styled-components'
import Icon from '@fp-icons/icon-base'
import PlusCircle from '@fp-icons/symbol-plus-circle'
import { Button } from 'fe-comp-button'
import { A } from 'fe-comp-dom-elements'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

const CancelButton = venk(
  withHsTheme(
    styled(Button)`
      margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
    `,
  ),
  'TagEditAreaCancelButton',
)
CancelButton.displayName = 'CancelButton'

const ApplyButton = venk(Button, 'TagEditAreaApplyButton')
ApplyButton.displayName = 'ApplyButton'

const InstagramTagInfoBannerContainer = withHsTheme(
  styled.div`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing12)};
  `,
)
InstagramTagInfoBannerContainer.displayName = 'InstagramTagInfoBannerContainer'

const TagHeader = withHsTheme(
  styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
  `,
)
TagHeader.displayName = 'TagHeader'

const AppliedTags = withHsTheme(
  styled.div`
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    font-size: ${() => getThemeValue(t => t.typography.body.size)};
  `,
)
AppliedTags.displayName = 'AppliedTags'

const NoTagApplied = withHsTheme(
  styled.div`
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    font-size: ${() => getThemeValue(t => t.typography.bodyPlaceHolder.size)};
    font-style: ${() => getThemeValue(t => t.typography.bodyPlaceHolder.style)};
  `,
)
NoTagApplied.displayName = 'NoTagApplied'

const EditTagButtonsWrapper = venk(
  withHsTheme(styled.div`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing24)};
    display: flex;
    justify-content: flex-end;
  `),
  'TagEditAreaFooter',
)
EditTagButtonsWrapper.displayName = 'EditTagButtonsWrapper'

const FooterItemWrapper = withHsTheme(
  styled.div`
    box-sizing: border-box;
    border-top: 2px solid ${() => getThemeValue(t => t.colors.dropdownMenu.border)};
    background-color: ${() => getThemeValue(t => t.colors.dropdownMenu.background)};
    padding: ${() =>
      getThemeValue(t => `${t.spacing.spacing16} 0 ${t.spacing.spacing16} ${t.spacing.spacing24}`)};
  `,
)
FooterItemWrapper.displayName = 'FooterItemWrapper'

const EditTagWrapper = withHsTheme(
  styled.div`
    border: 1px solid ${() => getThemeValue(t => t.colors.darkGrey60)};
    margin-top: ${() => getThemeValue(t => t.spacing.spacing4)};
    padding: ${() => getThemeValue(t => t.spacing.spacing24)};
  `,
)
EditTagWrapper.displayName = 'EditTagWrapper'

const RecapTagWrapper = withHsTheme(
  styled.div`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing12)};
  `,
)
RecapTagWrapper.displayName = 'RecapTagWrapper'

const CreateIconNotStyled = withHsTheme(({ className }) => (
  <Icon
    className={className}
    glyph={PlusCircle}
    fill="currentColor"
    size={getThemeValue(t => t.spacing.spacing12)}
  />
))

const CreateIcon = withHsTheme(
  styled(CreateIconNotStyled)`
    margin-right: ${() => getThemeValue(t => t.spacing.spacing4)};
  `,
)
CreateIcon.displayName = 'CreateIcon'

const AddTagLink = venk(A, 'AddTagLink')

const ManageTagLink = venk(A, 'ManageTagLink')

const EditTagLink = venk(A, 'EditTagLink')

export {
  CancelButton,
  ApplyButton,
  TagHeader,
  NoTagApplied,
  AppliedTags,
  EditTagButtonsWrapper,
  FooterItemWrapper,
  CreateIcon,
  InstagramTagInfoBannerContainer,
  EditTagWrapper,
  RecapTagWrapper,
  AddTagLink,
  ManageTagLink,
  EditTagLink,
}
