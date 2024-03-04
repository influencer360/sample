/**
 * @format
 * @preventMunge
 */

import './opt-out-survey-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import _ from 'underscore'
import translation from 'hs-nest/lib/utils/translation'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import Button from 'hs-nest/lib/components/buttons/button'
import RadioButton from 'hs-nest/lib/components/inputs/radio-button'
import TextArea from 'hs-nest/lib/components/inputs/text-area'
import DropDownMenu from 'hs-nest/lib/components/inputs/drop-down-menu'
import FeedbackService from '../../services/feedback-service'

export default class OptOutSurveyModal extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      rating: undefined,
      reason: undefined,
      feedback: undefined,
    }

    this.onBeforeOptOut = this.onBeforeOptOut.bind(this)
    this.feedbackService = new FeedbackService(props.facadeApiUrl)
  }

  onBeforeOptOut() {
    this.feedbackService.submitFeedback(
      _.extend(_.clone(this.state), {
        source: this.props.source,
      }),
    )

    this.props.onOptOut()
  }

  render() {
    // The mysql table has a limit of 50 characters on the reason
    const dropDownItems = [
      {
        label: translation._('Prefer not to say'),
        value: null,
      },
      {
        label: translation._('It’s easier to use'),
        value: 'It’s easier to use',
      },
      {
        label: translation._('I can’t do something that I need'),
        value: 'I can’t do something that I need',
      },
      {
        label: translation._('I encountered errors/ bugs'),
        value: 'I encountered errors/ bugs',
      },
      {
        label: translation._('Other'),
        value: 'Other',
      },
    ]

    const ratingOptions = _.map(_.range(1, 11), value => {
      return { label: value, value: value }
    })

    // prettier-ignore
    const ratingLabel = translation._('On a scale of 1 to 10 how would you rank the new %s1 experience, where 1 is bad and 10 is excellent?')
      .replace('%s1', this.props.newFeatureName)
    const titleText = translation._('Return to the old %s1').replace('%s1', this.props.oldFeatureName)

    const isFeedbackTooLong = this.state.feedback ? this.state.feedback.length > 500 : false
    const feedbackTooLongMessage = isFeedbackTooLong
      ? translation._('Please limit your feedback to 500 characters.')
      : ''

    const hasRating = this.state.rating !== undefined
    const isDisabled = isFeedbackTooLong || !hasRating

    const footer = (
      <span>
        <Button btnStyle="secondary" onClick={this.props.onClose}>
          {translation._('Cancel')}
        </Button>
        <Button btnStyle="primary" disabled={isDisabled} onClick={this.onBeforeOptOut}>
          {translation._('Return to old %s1').replace('%s1', this.props.oldFeatureName)}
        </Button>
      </span>
    )

    return (
      <SimpleModal
        footerContent={footer}
        hasBackdrop={true}
        hasCloseButton={true}
        onRequestHide={this.props.onClose}
        titleText={titleText}
        width="600px"
      >
        <div className="rc-OptOutSurveyModal">
          {/* prettier-ignore */}
          <p className="-description">
            {translation._('We’re sorry to see you go! We’re always looking to improve our products and your feedback is greatly appreciated.')}
          </p>
          <DropDownMenu
            defaultSelectedValue={this.state.reason}
            items={dropDownItems}
            label={translation._('Why are you returning to the old version?')}
            onChange={v => this.setState({ reason: v })}
          />
          <RadioButton
            isInlineMode={true}
            items={ratingOptions}
            label={ratingLabel}
            onChange={v => this.setState({ rating: v })}
            selectedValue={this.state.rating || ''}
          />
          <TextArea
            error={isFeedbackTooLong}
            instructions={feedbackTooLongMessage}
            // prettier-ignore
            label={translation._('Why did you choose this ranking? What could we have done better to improve your experience?')}
            onChange={v => this.setState({ feedback: v })}
            placeholder={translation._('Leave optional feedback')}
            rows={4}
          />
        </div>
      </SimpleModal>
    )
  }
}

OptOutSurveyModal.displayName = 'OptOutSurveyModal'

OptOutSurveyModal.propTypes = {
  facadeApiUrl: PropTypes.string.isRequired,
  newFeatureName: PropTypes.string.isRequired,
  oldFeatureName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onOptOut: PropTypes.func.isRequired,
  source: PropTypes.string.isRequired,
}

OptOutSurveyModal.defaultProps = {}
