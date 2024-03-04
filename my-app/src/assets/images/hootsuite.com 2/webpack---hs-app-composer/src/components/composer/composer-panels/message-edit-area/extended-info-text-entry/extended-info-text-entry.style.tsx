import styled from 'styled-components'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const EntryContainer = styled.div`
  &&& {
    & > div {
      display: block;
    }

    input {
      width: 100%;
    }
  }
`
EntryContainer.displayName = 'ExtendedInfoTextEntryContainer'

export const TitleContainer = styled.div`
  display: flex;
  align-items: center;
`

export const Header = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 ${() => getThemeValue(t => t.spacing.spacing4)} 0;
`)
