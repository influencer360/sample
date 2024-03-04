import React from 'react'

import styled from 'styled-components'
import { A } from 'fe-comp-dom-elements'
import { InputCheckbox } from 'fe-comp-input-checkbox'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import translation from 'fe-pnc-lib-hs-translation'

const LearnMore = withHsTheme(styled(A)`
  margin-left: ${() => getThemeValue(t => t.spacing.spacing4)};
`)

const BodyText = withHsTheme(styled.span`
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
`)

const DONT_SHOW_AGAIN = translation._("Don't show me this again")
const LEARN_MORE = translation._('Learn more')

export default ({ bodyText, onChange, isDontShowAgainCheckboxChecked }) => (
  <BodyText>
    {bodyText}
    <LearnMore
      href="https://help.hootsuite.com/hc/en-us/articles/360007943974"
      rel="noopener noreferrer"
      target="_blank"
    >
      {LEARN_MORE}
    </LearnMore>
    <div>
      <InputCheckbox {...{ onChange }} check={isDontShowAgainCheckboxChecked} label={DONT_SHOW_AGAIN} />
    </div>
  </BodyText>
)
