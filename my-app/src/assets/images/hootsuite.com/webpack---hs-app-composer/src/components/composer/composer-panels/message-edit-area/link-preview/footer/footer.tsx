import React from 'react'
import styled from 'styled-components'
import { AS_LINK, Button } from 'fe-comp-button'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import translation from 'fe-pnc-lib-hs-translation'

const CUSTOMIZE = translation._('Customize link preview')

const FooterWrapper = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  box-sizing: border-box;
  background: ${() => getThemeValue(t => t.colors.lightGrey10)};
  padding: ${() => getThemeValue(t => t.spacing.spacing8)};
  border: 1px solid
    ${({ hasError }) => getThemeValue(t => (hasError ? t.colors.errorBorder : t.colors.darkGrey60))};
  border-top: none;
`)
FooterWrapper.displayName = 'LinkPreviewFooter'

const FooterLinkWrapper = withHsTheme(styled.div`
  font-weight: ${() => getThemeValue(t => t.typography.hyperlink.weight)};
  font-size: ${() => getThemeValue(t => t.typography.hyperlink.size)};
  outline: none;
`)
FooterLinkWrapper.displayName = 'LinkPreviewFooterLinkWrapper'

const FooterLink = styled.a``
FooterLink.displayName = 'LinkPreviewFooterLink'

interface FooterProps {
  hasError: boolean
  onEdit(): void
}

const Footer = ({ onEdit, hasError }: FooterProps) => (
  // Remove hasError prop with PUB_30706_LINK_SETTINGS_PNE
  <FooterWrapper hasError={hasError} className="-footer">
    <Button className="-link" onClick={onEdit} type={AS_LINK}>
      {CUSTOMIZE}
    </Button>
  </FooterWrapper>
)

Footer.defaultProps = {
  onEdit: () => {},
}

export default Footer
