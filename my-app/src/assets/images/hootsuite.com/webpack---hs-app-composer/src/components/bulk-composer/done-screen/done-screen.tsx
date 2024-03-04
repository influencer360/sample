/**
 * @preventMunge
 */

import React from 'react'
import { AS_LINK, CTA } from 'fe-comp-button'
import translation from 'fe-pnc-lib-hs-translation'

import MessageEditStates, {
  MessageEditStatesCta,
  MessageEditStatesImage,
  MessageEditStatesLink,
  MessageEditStatesTitle,
} from '../../message-edit/message-edit-states/message-edit-states'
import PeopleHotairBalloons from '../glyphs/people-hotair-balloon'

const ALL_DONE = translation._("You're all done")
const VIEW_SCHEDULED = translation._('View scheduled posts')
const UPLOAD_ANOTHER = translation._('Or upload another file')

interface DoneScreenProps {
  onClose(): void
  onUploadAgain(): void
  onViewMessages(): void
  memberSignupDate: string
}

export default class DoneScreen extends React.PureComponent<DoneScreenProps> {
  viewMessages = () => {
    this.props.onViewMessages()
    this.props.onClose()
  }

  render() {
    const { onUploadAgain } = this.props

    return (
      <MessageEditStates className="rc-DoneScreen">
        <MessageEditStatesImage glyph={PeopleHotairBalloons} viewBox="0 0 311.6 548" />
        <MessageEditStatesTitle>{ALL_DONE}</MessageEditStatesTitle>
        <MessageEditStatesCta onClick={this.viewMessages} type={CTA}>
          {VIEW_SCHEDULED}
        </MessageEditStatesCta>
        <MessageEditStatesLink onClick={onUploadAgain} type={AS_LINK}>
          {UPLOAD_ANOTHER}
        </MessageEditStatesLink>
      </MessageEditStates>
    )
  }
}

DoneScreen.displayName = 'DoneScreen'
