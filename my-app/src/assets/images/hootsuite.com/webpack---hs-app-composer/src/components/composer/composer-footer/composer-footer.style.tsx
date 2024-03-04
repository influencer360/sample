import styled from 'styled-components'
import { Button, CTA } from 'fe-comp-button'
import { venk } from 'fe-hoc-venkman'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { ComposerFooter } from 'fe-pnc-comp-composer-modal'

export const StyledComposerBar = venk(
  styled(ComposerFooter)`
    justify-content: flex-end;
  `,
  'ComposerFooter',
)
StyledComposerBar.displayName = 'StyledComposerBar'

export const SaveDraftButton = venk(
  withHsTheme(
    styled(Button)`
      margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
    `,
  ),
  'SaveDraftButton',
)

SaveDraftButton.displayName = 'SaveDraftButton'

export const EditPostNextButton = venk(
  withHsTheme(
    styled(Button).attrs({
      type: CTA,
    })``,
  ),
  'EditPostNextButton',
)

EditPostNextButton.displayName = 'EditPostNextButton'

export const NewTemplateButton = venk(
  withHsTheme(
    styled(Button).attrs({
      type: CTA,
    })``,
  ),
  'NewTemplateButton',
)

NewTemplateButton.displayName = 'NewTemplateButton'

export const BannerContainer = venk(
  withHsTheme(styled.div`
    && {
      margin-right: ${() => getThemeValue(t => t.spacing.spacing24)};
    }
    > p {
      margin-top: ${() => getThemeValue(t => t.spacing.spacing24)};
    }
  `),
  'InstagramDirectInfoBanner',
)
BannerContainer.displayName = 'InstagramDirectInfoBanner'
