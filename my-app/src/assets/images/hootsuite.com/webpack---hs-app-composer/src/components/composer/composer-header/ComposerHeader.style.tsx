import React from 'react'
import loadable from '@loadable/component'
import styled from 'styled-components'
import { Button, ROUND_CORNERS } from 'fe-comp-button'
import { PLACEMENT_TOP } from 'fe-hoc-tooltip'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { ExpandedUiMixin } from 'fe-pnc-comp-composer-modal'
import { withCTTIInstance } from 'fe-pnc-lib-ctti'

// Lazy loaded components
const LoadableConnectedOrgPicker = loadable(
  () => import(/* webpackChunkName: "OrganizationPicker" */ 'fe-pnc-comp-connected-org-picker'),
)

export const HeaderLabel = venk(
  withHsTheme(styled.h2`
    font-size: ${() => getThemeValue(t => t.typography.pageTitle.size)};
    font-weight: ${() => getThemeValue(t => t.typography.pageTitle.weight)};
    margin-top: -2px;
    margin-left: ${({ hasIcon }) => (hasIcon ? getThemeValue(t => t.spacing.spacing8) : 0)};
  `),
  'HeaderLabel',
)
HeaderLabel.displayName = 'HeaderLabel'

export const HeaderLabelContainer = styled.div`
  display: flex;
`
HeaderLabelContainer.displayName = 'HeaderLabelContainer'

export const HeaderLabelDivider = withHsTheme(styled.div`
  width: 1px;
  height: ${() => getThemeValue(t => t.spacing.spacing24)};
  margin: 0 ${() => getThemeValue(t => t.spacing.spacing24)};
`)
HeaderLabelDivider.displayName = 'HeaderLabelDivider'

export const OptOutButton = withHsTheme(
  styled(Button).attrs({
    styleModifiers: [ROUND_CORNERS],
  })`
    margin-left: auto;
    margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
  `,
)
OptOutButton.displayName = 'OptOutButton'

// For some reason styled-components cannot be used directly on a loadable component
const ConnectedOrgPicker = props => <LoadableConnectedOrgPicker {...props} />

export const StyledOrgPicker = withCTTIInstance(
  'Composer',
  'OrgSelect',
  withHsTheme(
    styled(ConnectedOrgPicker).attrs({
      tooltipPosition: PLACEMENT_TOP,
      showLabel: true,
    })`
      margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
      max-width: 300px;
      button {
        ${ExpandedUiMixin}
      }
    `,
  ),
)
StyledOrgPicker.displayName = 'StyledOrgPicker'
