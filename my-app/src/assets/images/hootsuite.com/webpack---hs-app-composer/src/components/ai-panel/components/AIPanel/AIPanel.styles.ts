import styled, { keyframes } from 'styled-components'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const Container = withHsTheme(styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${() => getThemeValue(t => t.colors.lightGrey20)};
`)
Container.displayName = 'AIPanelContainer'

export const ScrollContainer = styled.div`
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
`
ScrollContainer.displayName = 'ScrollContainer'

export const LoadingState = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 50px;
  align-items: center;
  justify-content: center;
`
LoadingState.displayName = 'LoadingState'

export const CenterColumn = withHsTheme(styled.div`
  position: relative;
  padding: ${() => getThemeValue(t => t.spacing.spacing24)} ${() => getThemeValue(t => t.spacing.spacing20)}
    0px ${() => getThemeValue(t => t.spacing.spacing20)};
  margin: 0 auto;
  width: 490px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`)
CenterColumn.displayName = 'CenterColumn'

export const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

export const DescriptionContainer = withHsTheme(styled.div`
  display: flex;
  flex-direction: column;
  gap: ${() => getThemeValue(t => t.spacing.spacing24)};
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing36)};
`)
DescriptionContainer.displayName = 'DescriptionContainer'

export const Description = withHsTheme(styled.p`
  font-size: ${() => getThemeValue(t => t.typography.size.body)};
  margin: 0;
`)
Description.displayName = 'Description'

export const FadeIn = styled.div`
  animation: 300ms ease-out 0s 1 ${fadeIn};
`
