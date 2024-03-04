import React from 'react'

import { CTA } from 'fe-comp-button'
import translation from 'fe-pnc-lib-hs-translation'
import { ENTER, keyboardEventHandler } from 'fe-pnc-lib-keyboard-events'

import { TitleText } from '../title-text'
import {
  AppliedPublisherNotesText,
  CancelButton,
  DoneButton,
  EditPublisherNotes,
  NotAppliedPublisherNotesText,
  PublisherNotesBody,
  PublisherNotesFooter,
  PublisherNotesHeader,
  PublisherNotesInput,
  PublisherNotesInputContainer,
} from './publisher-notes.style'

const NOTES_FOR_PUBLISHER = translation._('Notes for the publisher')
const NO_NOTES_ADDED = translation._('No notes added.')
const EDIT = translation._('Edit')
const ADD = translation._('Add')
const CANCEL = translation._('Cancel')
const DONE = translation._('Apply')

interface PublisherNotesProps {
  appliedPublisherNotes?: string
  onDoneApplyPublisherNotes(publisherNotes: string): void
}

class PublisherNotes extends React.PureComponent<PublisherNotesProps> {
  static displayName = 'PublisherNotes'

  static defaultProps = {
    appliedPublisherNotes: '',
  }

  constructor(props) {
    super(props)

    this.state = {
      isEditing: false,
      publisherNotes: this.props.appliedPublisherNotes,
    }
  }

  onDone = () => {
    const publisherNotesToUpdate = this.state.publisherNotes
    this.setState({
      isEditing: false,
      publisherNotes: '',
    })

    this.props.onDoneApplyPublisherNotes(publisherNotesToUpdate)
  }

  onCancel = () => {
    this.setState({
      isEditing: false,
      publisherNotes: '',
    })
  }

  handleChange = event => {
    this.setState({
      publisherNotes: event.target.value,
    })
  }

  renderHeader = () => {
    return (
      <PublisherNotesHeader>
        <TitleText>{NOTES_FOR_PUBLISHER}</TitleText>
        {!this.state.isEditing ? this.renderEditButton() : null}
      </PublisherNotesHeader>
    )
  }

  renderAddPublisherNotesInput() {
    return (
      <PublisherNotesInput
        rows={3}
        value={this.state.publisherNotes}
        onChange={this.handleChange}
        autoFocus={true}
      />
    )
  }

  renderAddPublisherNotesFooter() {
    return (
      <PublisherNotesFooter>
        <CancelButton onClick={this.onCancel}>{CANCEL}</CancelButton>
        <DoneButton btnStyle="action" onClick={this.onDone} type={CTA}>
          {DONE}
        </DoneButton>
      </PublisherNotesFooter>
    )
  }

  renderEditButton() {
    return (
      <EditPublisherNotes
        onClick={this.onEditClick}
        onKeyDown={keyboardEventHandler({
          [ENTER]: this.onEditClick,
        })}
        role="button"
        tabIndex="0"
      >
        {this.props.appliedPublisherNotes ? EDIT : ADD}
      </EditPublisherNotes>
    )
  }

  renderAppliedPublisherNotes() {
    return this.props.appliedPublisherNotes ? (
      <AppliedPublisherNotesText>{this.props.appliedPublisherNotes}</AppliedPublisherNotesText>
    ) : (
      <NotAppliedPublisherNotesText>{NO_NOTES_ADDED}</NotAppliedPublisherNotesText>
    )
  }

  onEditClick = () => {
    this.setState({
      isEditing: true,
      publisherNotes: this.props.appliedPublisherNotes,
    })
  }

  render() {
    const bodyNode = this.state.isEditing ? (
      <>
        {this.renderAddPublisherNotesInput()}
        {this.renderAddPublisherNotesFooter()}
      </>
    ) : (
      <>{this.renderAppliedPublisherNotes()}</>
    )

    return (
      <PublisherNotesInputContainer isEditing={this.state.isEditing}>
        {this.renderHeader()}
        <PublisherNotesBody isEditing={this.state.isEditing}>{bodyNode}</PublisherNotesBody>
      </PublisherNotesInputContainer>
    )
  }
}

export default PublisherNotes
