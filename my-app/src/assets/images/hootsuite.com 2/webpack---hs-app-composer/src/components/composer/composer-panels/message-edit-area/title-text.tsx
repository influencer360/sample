import styled from 'styled-components'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

// This h3 styled component should be temporary until
// we have a standard way of showing h4 headings.
// H4 from fe-comp-dom-elements is not used as it changes
// the font weight and size of the text

export const TitleText = withHsTheme(styled.h3`
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  font-size: ${() => getThemeValue(t => t.typography.label.size)};
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  line-height: ${() => getThemeValue(t => t.typography.label.lineHeight)};
  margin-bottom: 0;
`)
