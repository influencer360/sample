import styled from 'styled-components'
import { Footer } from 'fe-comp-dialog'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

const Container = venk(
  styled.div`
    outline: 0;
    width: 600px;
  `,
  'PinterestBoardCreationModal',
)
Container.displayName = 'PinterestBoardCreationModal'

const SubmitButton = venk(Footer.Buttons.PrimaryAction, 'SubmitButton')
SubmitButton.displayName = 'SubmitButton'

const CancelButton = venk(Footer.Buttons.SecondaryAction, 'CancelButton')
CancelButton.displayName = 'CancelButton'

const Field = styled.div``
Field.displayName = 'Field'

const ModalContainer = withHsTheme(
  styled.div`
    & > ${Field}:first-child {
      margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
    }
  `,
)
ModalContainer.displayName = 'ModalContainer'

const FieldTitle = withHsTheme(
  styled.div`
    align-items: flex-end;
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    flex: 1 0 auto;
    font-size: ${() => getThemeValue(t => t.typography.label.size)};
    font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
    justify-content: flex-start;
    padding: 0 0 ${() => getThemeValue(t => t.spacing.spacing8)} 0;
  `,
)
FieldTitle.displayName = 'FieldTitle'

const BoardNameTextInputContainer = styled.div`
  display: flex;

  & > div {
    flex: 1;
  }
`
BoardNameTextInputContainer.displayName = 'BoardNameTextInputContainer'

export {
  BoardNameTextInputContainer,
  CancelButton,
  Container,
  Field,
  FieldTitle,
  ModalContainer,
  SubmitButton,
}
