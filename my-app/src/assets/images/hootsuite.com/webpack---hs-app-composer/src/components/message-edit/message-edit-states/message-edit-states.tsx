import React from 'react'
import styled from 'styled-components'
import Icon from '@fp-icons/icon-base'
import { Button } from 'fe-comp-button'
import { H2 } from 'fe-comp-dom-elements'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

const CenteredContentContainer = withHsTheme(styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  min-height: 600px;
  padding: ${() => getThemeValue(t => t.spacing.spacing40)};
  box-sizing: border-box;
  background: ${p => (p.noBackground ? `transparent` : `${getThemeValue(t => t.colors.lightGrey)}`)};
`)

const CenteredContent = withHsTheme(styled.div`
  display: flex;
  flex-direction: column;
  max-width: 400px;
`)

const Title = withHsTheme(styled(H2)`
  font-weight: ${() => getThemeValue(t => t.typography.subSectionTitle.weight)};
  margin: 0 0 ${() => getThemeValue(t => t.spacing.spacing8)} 0;
  font-size: ${() => getThemeValue(t => t.typography.subSectionTitle.size)};
`)
Title.displayName = 'MessageEditStatesTitle'

const Text = withHsTheme(styled.p`
  margin: 0 0 ${() => getThemeValue(t => t.spacing.spacing8)} 0;
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
`)
Text.displayName = 'MessageEditStatesText'

const Cta = withHsTheme(styled(Button)`
  margin: ${() => getThemeValue(t => t.spacing.spacing16)} 0 ${() => getThemeValue(t => t.spacing.spacing12)}
    0;
`)
Cta.displayName = 'MessageEditStatesCta'

const Link = styled(Button)`
  margin: 0;
`
Link.displayName = 'MessageEditStatesLink'

const ImgWrapper = styled.div`
  width: 250px;
  height: 270px;
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
`

const Img = props => (
  <ImgWrapper>
    <Icon {...props} width="100%" height="100%" />
  </ImgWrapper>
)

interface MessageEditStatesProps {
  className?: string
  noBackground?: boolean
  children?: React.ReactElement
}

const MessageEditStates = ({ className, children, noBackground }: MessageEditStatesProps) => (
  <CenteredContentContainer noBackground={noBackground} className={className}>
    <CenteredContent>{children}</CenteredContent>
  </CenteredContentContainer>
)

MessageEditStates.defaultProps = {
  className: '',
  noBackground: false,
  children: [],
}

export default MessageEditStates
export {
  Title as MessageEditStatesTitle,
  Text as MessageEditStatesText,
  Cta as MessageEditStatesCta,
  Link as MessageEditStatesLink,
  Img as MessageEditStatesImage,
}
