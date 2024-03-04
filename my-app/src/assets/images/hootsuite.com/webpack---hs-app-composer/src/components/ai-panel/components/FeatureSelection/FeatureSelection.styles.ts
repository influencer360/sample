import styled from 'styled-components'

import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const ListContainer = withHsTheme(styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
`)
ListContainer.displayName = 'AIListContainer'
