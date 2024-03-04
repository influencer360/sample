import styled from 'styled-components'
import { Button, PRIMARY } from 'fe-comp-button'
import { A } from 'fe-comp-dom-elements'
import { TextArea } from 'fe-comp-input-text-area'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const PublisherNotesHeader = withHsTheme(
  venk(
    styled.div`
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: flex-start;
      align-items: center;
      padding: 0;
    `,
    'PublisherNotesHeader',
  ),
)
PublisherNotesHeader.displayName = 'PublisherNotesHeader'

export const AppliedPublisherNotesText = withHsTheme(
  venk(
    styled.div`
      box-sizing: border-box;
      color: ${() => getThemeValue(t => t.colors.darkGrey)};
      font-size: ${() => getThemeValue(t => t.typography.body.size)};
      margin-top: ${() => getThemeValue(t => t.spacing.spacing12)};
      overflow-wrap: break-word;
      white-space: pre-wrap;
    `,
    'AppliedPublisherNotesText',
  ),
)
AppliedPublisherNotesText.displayName = 'AppliedPublisherNotesText'

export const NotAppliedPublisherNotesText = withHsTheme(
  venk(
    styled.div`
      box-sizing: border-box;
      color: ${() => getThemeValue(t => t.colors.darkGrey)};
      font-size: ${() => getThemeValue(t => t.typography.bodyPlaceHolder.size)};
      font-style: ${() => getThemeValue(t => t.typography.bodyPlaceHolder.style)};
      margin-top: ${() => getThemeValue(t => t.spacing.spacing12)};
      overflow-wrap: break-word;
      white-space: pre-wrap;
    `,
    'NotAppliedPublisherNotesText',
  ),
)
NotAppliedPublisherNotesText.displayName = 'NotAppliedPublisherNotesText'

export const PublisherNotesBody = styled.div``
PublisherNotesBody.displayName = 'PublisherNotesBody'

export const PublisherNotesInputContainer = styled.div``
PublisherNotesInputContainer.displayName = 'PublisherNotesInputContainer'

export const PublisherNotesFooter = withHsTheme(
  venk(
    styled.div`
      align-items: center;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      justify-content: flex-end;
      margin-top: ${() =>
        getThemeValue(
          t => t.spacing.spacing16,
        )}; /* it should be 24 but the text area has a margin-bottom of 8px */
    `,
    'PublisherNotesFooter',
  ),
)
PublisherNotesFooter.displayName = 'PublisherNotesFooter'

export const PublisherNotesInput = venk(
  styled(TextArea)`
    min-height: 100px;
    width: 100%;
  `,
  'PublisherNotesInput',
)
PublisherNotesInput.displayName = 'PublisherNotesInput'

export const EditPublisherNotes = venk(
  styled(A)`
    margin-left: auto;
  `,
  'EditPublisherNotesBtn',
)
EditPublisherNotes.displayName = 'EditPublisherNotes'

export const CancelButton = withHsTheme(
  venk(
    styled(Button).attrs({
      type: PRIMARY,
    })`
      margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
    `,
    'PublisherNotesCancelBtn',
  ),
)
CancelButton.displayName = 'CancelButton'

export const DoneButton = venk(styled(Button)``, 'PublisherNotesDoneButton')
DoneButton.displayName = 'DoneButton'
