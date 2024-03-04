import styled from 'styled-components'
import { Button } from 'fe-comp-button'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const HeaderContainer = withHsTheme(styled.div`
  width: 100%;
  display: flex;
  height: 70px;
  justify-content: space-between;
  padding: 0px ${() => getThemeValue(t => t.spacing.spacing20)};
  box-sizing: border-box;
  position: relative;
  .left {
    display: flex;
    align-items: center;
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    font-size: ${() => getThemeValue(t => t.typography.size.h1)};
    font-weight: ${() => getThemeValue(t => t.typography.fontWeight.bold)};
    button {
      margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
    }
  }
  .right {
    display: flex;
    align-items: center;
  }
`)
HeaderContainer.displayName = 'AIPanelHeader'

export const LinkButton = withHsTheme(styled(Button)`
  line-height: ${() => getThemeValue(t => t.spacing.button.height)};
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing12)};
`)
LinkButton.displayName = 'AIPanelCloseButton'
