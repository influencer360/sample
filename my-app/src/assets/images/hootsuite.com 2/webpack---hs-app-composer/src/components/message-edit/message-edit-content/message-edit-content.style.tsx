import styled from 'styled-components'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const Header = withHsTheme(
  styled.div`
    font-family: ${() => getThemeValue(t => t.typography.fontFamily.primary)};
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1px;
  `,
)
Header.displayName = 'MessageEditHeader'

export const MessageTabBarContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
`
MessageTabBarContainer.displayName = 'MessageTabBarContainer'

export const Title = styled.div`
  flex: 1 0 auto;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: center;
`
Title.displayName = 'MessageEditTextTitle'

export const Content = styled.div`
  box-shadow: 0 0 0 1px ${() => getThemeValue(t => t.colors.input.border)};
  padding-botttom: ${() => getThemeValue(t => t.spacing.spacing24)};
`
Content.displayName = 'MessageEditContent'

export const ValidationContainer = styled.div`
  padding: ${() => getThemeValue(t => t.spacing.spacing12)} ${() => getThemeValue(t => t.spacing.spacing24)} 0
    ${() => getThemeValue(t => t.spacing.spacing24)};
`

export const BannerContainer = styled.div`
  margin: ${() => getThemeValue(t => t.spacing.spacing12)} 0;
`

BannerContainer.displayName = 'BannerContainer'
