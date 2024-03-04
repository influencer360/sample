import styled from 'styled-components'
import { venk } from 'fe-hoc-venkman'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const StyledTiktokEngagementArea = withHsTheme(
  venk(
    styled.div`
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      max-width: 50%;
      align-items: center;
      padding: 0;
      & > label {
        white-space: nowrap;
        justify-content: space-between;
        margin-right: ${() => getThemeValue(t => t.spacing.spacing12)};
        padding-right: 0;
      }
    `,
    'StyledTiktokEngagementArea',
  ),
)
StyledTiktokEngagementArea.displayName = 'StyledTiktokEngagementArea'
