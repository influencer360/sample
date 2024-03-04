/**
 * @preventMunge
 */

import React, { ComponentType } from 'react'
import Immutable from 'immutable'
import { noop } from 'lodash'
import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import { connect as reduxConnect } from 'react-redux'
import _ from 'underscore'

import axios from 'fe-axios'
import { P } from 'fe-comp-dom-elements'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { on, off } from 'fe-lib-hootbus'
import { logError } from 'fe-lib-logging'
import { provisionIndex } from 'fe-lib-zindex'
import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import {
  actions as ComposerMessageActions,
  getMessages,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import { getStore as getMessagePreviewsStore } from 'fe-pnc-data-message-previews'
import type { PreviewsState, SanitizedMessage } from 'fe-pnc-data-message-previews'
import type { Profile, SocialProfileState } from 'fe-pnc-data-social-profiles-v2'
import { store as socialProfileStore } from 'fe-pnc-data-social-profiles-v2'

import { bulkSchedulePublish, bulkScheduleUpload } from 'fe-pnc-lib-api'
import { isFeatureEnabled, isFeatureEnabledOrBeta, getFeatureValue } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'

import Composer from '@/components/composer/composer'
import ComposerFunctional from '@/components/composer/composer-functional'
import ComposerHeader from '@/components/composer/composer-header'
import BulkComposerConstants from '@/constants/bulk-composer'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import TrackingConstants from '@/constants/tracking'
import Message from '@/models/message'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import { BulkScheduleResponse, BulkMessage } from '@/typings/BulkComposer'
import { ComposerState } from '@/typings/Constants'
import { Flux, Organization, Organizations } from '@/typings/Flux'
import { SocialNetwork, SocialNetworksKeyedByType } from '@/typings/SocialNetwork'
import { savePublisherSetting } from '@/utils/composer-data-fetcher'
import ComposerUtils from '@/utils/composer-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'
import { track } from '@/utils/tracking'
// View components
import DoneScreen from './done-screen/done-screen'
import {
  trackSingleBulkComposerMessage,
  trackBulkComposerScheduleMessages,
} from './track-bulk-composer-message'
import WelcomeScreen from './welcome-screen/welcome-screen'

const ERROR_MESSAGES_SCHEDULED_FAILURE = translation._('Some of your posts failed to schedule.')
const ERROR_MESSAGE_SCHEDULED_FAILURE = translation._('Your post could not be scheduled')
const MESSAGES_SCHEDULED = (numMessages: any) =>
  translation._('%d posts scheduled.').replace('%d', numMessages)
const ERROR_UNKNOWN = translation._('An unknown error occurred. Please try again.')
const SUCCESS_MESSAGE_SCHEDULED = translation._('Your post was successfully scheduled')
const ERROR_FILE = translation._('There was a problem with your file')
const ERROR_TOO_MANY_MESSAGES = translation._("You're trying to schedule too many posts")
const ERROR_UPLOAD_FILE = translation._('There was an error uploading your file.')

// prettier-ignore
const RICH_ERROR_1 = (numLinesInCsv: any, numSocialNetworks: any, numMessagesInCsv: any) => translation._('Your file contains %s1 posts; across your %s2 selected accounts this would add an additional %s3 new scheduled posts.')
    .replace('%s1', numLinesInCsv)
    .replace('%s2', numSocialNetworks)
    .replace('%s3', numMessagesInCsv)
const RICH_ERROR_2 = (numMessagesPending: any) =>
  translation._('You currently have %s1 scheduled posts in Hootsuite.').replace('%s1', numMessagesPending)
const RICH_ERROR_3 = (maxNumMessages: any, numMessagesOver: any) =>
  // prettier-ignore
  translation._('Your scheduled post limit is %s1; this would take you %s2 over your limit.')
    .replace('%s1', maxNumMessages)
    .replace('%s2', numMessagesOver)
const RICH_ERROR_4 = translation._('Recommended fixes:')
// prettier-ignore
const RICH_ERROR_5 = translation._("Reduce the number of posts from your CSV file and/or reduce the number of target accounts you're sending to.")
const STAY_HERE = translation._('Stay here')
const LEAVE_BULK_COMPOSER = translation._('Leave Bulk Composer')
// prettier-ignore
const WARN_MODAL_LEAVE = (numMessages: any) => translation._('%d of your posts have not been scheduled. These posts will be discarded when you leave. Do you want to leave without finishing?').replace('%d', numMessages)
const OK_CLOSE = translation._('Ok, Close')

const UPLOAD_STATE = {
  BEGIN: 'begin',
  ERROR: 'error',
  SUCCESS: 'success',
}

const { SN_TYPES } = SocialProfileConstants

type UploadState = typeof UPLOAD_STATE[keyof typeof UPLOAD_STATE]

const trackUploadState = (state: UploadState) => {
  track('web.publisher.bulk_composer.upload', `upload_${state}`)
}

interface BulkComposerProps {
  csrf: string
  dispatch: AppDispatch
  excludedNetworkTypes?: Array<SocialNetworkType>
  facadeApiUrl: string
  fetchDataForBulkComposer?: (organization: Organization) => void
  flux: Flux
  FluxComponent: ComponentType<any>
  ignoredPreviewValidationMessageCodes?: Array<string>
  isUsingLATM?: boolean
  memberId: number
  memberSignupDate: string
  messages?: Array<Message>
  onClose: () => void
  onSelectNewOrganization?: (organization: Organization) => void
  onViewMessages: () => void
  optOut: () => void
  organizations?: Organizations
  privateSocialProfiles: Array<Profile>
  selectedMessageForEdit?: Message
  selectedOrganization?: Organization
  shouldShortenUrlsInBulk?: boolean
  socialNetworks: Array<SocialNetwork>
  socialProfilesKeyedByType?: SocialNetworksKeyedByType
  timezoneName: string
}

interface BulkComposerState {
  composerState: ComposerState
  isLoading: boolean
  previewMessages: Array<SanitizedMessage>
  selectedSocialNetworkIds: Array<number>
}

// eslint-disable-next-line valid-jsdoc
/**
 * BulkComposer is a composer for managing multiple messages generated by a csv
 */
class BulkComposer extends React.Component<BulkComposerProps, BulkComposerState> {
  composerMessageActions: any
  statusObject: StatusObject
  unsubscribeObservers: Array<() => void>
  _onPathChanged: (newPath: string) => void
  _onNavigate: (e: HashChangeEvent) => void
  _onHistoryChanged: () => void
  isClosing: boolean

  static displayName = 'Bulk Composer'

  static defaultProps = {
    dispatch: action => action,
    excludedNetworkTypes: [],
    fetchDataForBulkComposer: () => {},
    ignoredPreviewValidationMessageCodes: [],
    isUsingLATM: false,
    messages: [],
    onSelectNewOrganization: () => {},
    selectedOrganization: {},
    shouldShortenUrlsInBulk: true,
    socialNetworks: [],
  }

  constructor(props: BulkComposerProps) {
    super(props)

    this.state = {
      isLoading: false,
      composerState: ComposerConstants.STATE.PRECOMPOSE,
      selectedSocialNetworkIds: [],
      previewMessages: [],
    }

    this.unsubscribeObservers = [noop]

    this.composerMessageActions = ComposerMessageActions

    // We want to make sure we're always using the same instance. This is important for dependency injection
    this.statusObject = statusObject

    this.isClosing = false
  }

  componentDidMount() {
    this._onPathChanged = newPath => {
      if (newPath !== Constants.ROUTES.PUBLISHER.BULK_COMPOSER) {
        this.onClose()
      }
      off('address:path:change', this._onPathChanged)
    }
    // listen for an external or manual path change. This doesn't fire on back button, nor is it very reliable,
    // but it does detect when other code manually navigates
    on('address:path:change', this._onPathChanged)

    this._onNavigate = e => {
      // hashchange event: https://developer.mozilla.org/en-US/docs/Web/Events/hashchange
      // Trigger the close modal
      // On cancel, we need to push the duplicate state back onto history, to undo the back the user did
      if (e.newURL.split('#')[1] !== Constants.ROUTES.PUBLISHER.BULK_COMPOSER) {
        this.onClose(false, undefined, () => {
          history.pushState(null, '', '#' + Constants.ROUTES.PUBLISHER.BULK_COMPOSER)
        })
      }
    }

    this._onHistoryChanged = () => {
      // Trigger the close modal
      // On cancel, we need to push the duplicate state back onto history, to undo the back the user did
      // On confirm, we need to go back again, to do the back that the user originally intended
      this.onClose(
        false,
        () => history.back(),
        () => {
          history.pushState(null, null, '#' + Constants.ROUTES.PUBLISHER.BULK_COMPOSER)
        },
      )
    }

    this.unsubscribeObservers = [
      observeStore(
        getMessagePreviewsStore(),
        (previewMessages: Array<SanitizedMessage>): void => this.setState({ previewMessages }),
        (state: PreviewsState) => state.previewMessages,
        isEqual,
      ),
    ]

    window.addEventListener('hashchange', this._onNavigate)
    window.addEventListener('popstate', this._onHistoryChanged)
  }

  componentWillUnmount() {
    over(this.unsubscribeObservers)()

    window.removeEventListener('hashchange', this._onNavigate)
    window.removeEventListener('popstate', this._onHistoryChanged)
  }

  resetToWelcomeScreen = () => {
    this.composerMessageActions.reset()
    this.setState({
      isLoading: false,
      selectedSocialNetworkIds: [],
      composerState: ComposerConstants.STATE.PRECOMPOSE,
    })
  }

  scheduleMessages = (messageIdsToSchedule: Array<number>) => {
    let messagesToPost = this.props.messages
    trackBulkComposerScheduleMessages(messageIdsToSchedule, messagesToPost)

    messagesToPost = messagesToPost.filter(message => {
      return messageIdsToSchedule.indexOf(message.id) > -1
    })

    const messageRequestObjs = []

    messagesToPost.forEach(
      function (message: Message) {
        messageRequestObjs.push(message.stripUrlPreviewIfAttachmentsExist().toBulkPostRequest())
      }.bind(this),
    )

    this.setState({ isLoading: true })

    return bulkSchedulePublish(messageRequestObjs)
      .then(data => {
        if (data.success && data.bulkMessagesPublishResponse) {
          let messageIdsToRemove = _.clone(messageIdsToSchedule)
          let failedMessageIds = []
          const errors = data.bulkMessagesPublishResponse.errors
          if (errors && _.keys(errors).length > 0) {
            failedMessageIds = _.map(errors, (value, key) => {
              const id = Number(key)
              this.composerMessageActions.updateFieldById(id, Constants.FIELD_TO_UPDATE.ERRORS, {
                scheduleError: [{ message: value, details: ['Scheduling error'] }],
              })
              return id
            })
            messageIdsToRemove = _.difference(messageIdsToRemove, failedMessageIds)

            this.statusObject.update(ERROR_MESSAGES_SCHEDULED_FAILURE, 'error', true)
          } else {
            this.statusObject.update(MESSAGES_SCHEDULED(messageIdsToRemove.length), 'success', true)
          }

          messageIdsToRemove.forEach(id => {
            this.composerMessageActions.removeById(id)
          })

          return failedMessageIds
        }
        this.setState({ isLoading: false })

        return []
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          this.statusObject.update(ERROR_UNKNOWN, 'error', true)
          logError(LOGGING_CATEGORIES.BULK_COMPOSER, 'Failed to bulk schedule messages', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  scheduleSingleMessage = messageToSend => {
    trackSingleBulkComposerMessage(messageToSend)
    return bulkSchedulePublish([messageToSend.stripUrlPreviewIfAttachmentsExist().toBulkPostRequest()])
      .then(data => {
        const messageId = messageToSend.id
        if (data.success && data.bulkMessagesPublishResponse) {
          const errors = data.bulkMessagesPublishResponse.errors
          if (errors && _.keys(errors).length > 0) {
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ERRORS, {
              scheduleError: [{ message: errors[messageId], details: ['Scheduling error'] }],
            })
            this.statusObject.update(ERROR_MESSAGE_SCHEDULED_FAILURE, 'error', true)
          } else {
            // Update store
            this.composerMessageActions.removeById(messageId)
            this.statusObject.update(SUCCESS_MESSAGE_SCHEDULED, 'success', true)
            const firstHeadingInMessageSelectionHeader = document.querySelector<HTMLElement>(
              `.${BulkComposerConstants.CLASS_NAMES.BULK_COMPOSER} .${BulkComposerConstants.CLASS_NAMES.MESSAGE_SELECTION_HEADER} h2`,
            )
            if (firstHeadingInMessageSelectionHeader) {
              firstHeadingInMessageSelectionHeader.focus()
            }
            return messageToSend.id
          }
        }

        return null
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.BULK_COMPOSER, 'Failed to schedule single message', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
        this.statusObject.update(ERROR_MESSAGE_SCHEDULED_FAILURE, 'error', true)
      })
  }

  /**
   * Closes the bulk composer, while also displaying a confirm modal if the user might lose data
   * @param [shouldRedirect] If true, after closing we will redirect to the scheduled page. Defaults to false
   * @param [onConfirmNavigate] A function to call when the user wants want to leave (eg: cleanup browser history)
   * @param [onCancelNavigate] A function to call when the user does not want to leave (eg: cleanup browser history)
   */
  onClose = (shouldRedirect = false, onConfirmNavigate?: () => void, onCancelNavigate?: () => void) => {
    if (this.isClosing) {
      // If we are already closing, do not run this method once again!
      // It can happen if we "close with redirect" (see shouldRedirect below): this._onHistoryChanged will try to re-run onClose
      return
    }

    const onCloseFn = () => {
      this.isClosing = true
      if (shouldRedirect) {
        window.location.href = '#' + Constants.ROUTES.PUBLISHER.SCHEDULED
      }
      this.props.onClose()
    }

    if (this.props.messages.length > 0) {
      const onConfirm = () => {
        const messagesTrackerObject = { errorMessages: 0, goodMessages: 0 }
        this.props.messages.forEach(message => {
          if (message.hasErrors()) {
            messagesTrackerObject.errorMessages++
          } else {
            messagesTrackerObject.goodMessages++
          }
        })
        track('web.publisher.bulk_composer.abort_exit', 'confirm_exit', messagesTrackerObject)
        this.composerMessageActions.reset()
        onCloseFn()
        if (_.isFunction(onConfirmNavigate)) {
          onConfirmNavigate()
        }
      }

      showConfirmationModal({
        titleText: LEAVE_BULK_COMPOSER,
        bodyText: <P>{WARN_MODAL_LEAVE(this.props.messages.length)}</P>,
        submitButtonText: LEAVE_BULK_COMPOSER,
        cancelButtonText: STAY_HERE,
        onSubmit: (close: () => void) => {
          onConfirm()
          close()
        },
        onCancel: () => {
          if (_.isFunction(onCancelNavigate)) {
            onCancelNavigate()
          }
        },
      })
    } else {
      track('web.publisher.bulk_composer.abort_exit', 'confirm_exit', {
        errorMessages: 0,
        goodMessages: 0,
      })
      onCloseFn()
    }
  }

  onNextClicked = (file, dateFormat, parsedDates, shouldSetDefaultPostType) => {
    const { shouldShortenUrlsInBulk, socialNetworks } = this.props
    const form = new FormData()
    form.append('csvFile', file)
    form.append('socialNetworks', this.state.selectedSocialNetworkIds.toString())
    form.append('dateFormat', dateFormat)

    if (shouldSetDefaultPostType) {
      form.append(`postType[${SN_TYPES.INSTAGRAMBUSINESS}]`, Constants.INSTAGRAM_POST_TYPE_DEFAULT.postType)
      form.append(
        `publishingMode[${SN_TYPES.INSTAGRAMBUSINESS}]`,
        Constants.INSTAGRAM_PUBLISHING_MODE_DEFAULT.mode,
      )
    }

    parsedDates = Object.keys(parsedDates).reduce((acc, nextLine) => {
      acc[nextLine] = Object.keys(parsedDates[nextLine].parsedFormats).reduce((formatAcc, nextFormat) => {
        if (parsedDates[nextLine].parsedFormats[nextFormat]) {
          formatAcc[nextFormat] = String(parsedDates[nextLine].parsedFormats[nextFormat]).slice(0, -3)
        } else {
          formatAcc[nextFormat] = null
        }

        return formatAcc
      }, {})
      return acc
    }, {})
    form.append('parsedDates', JSON.stringify(parsedDates))

    const options = {
      type: 'POST',
      url: '/ajax/scheduler/bulk-schedule-upload',
      data: form,
      processData: false, // tell jQuery not to process the data
      contentType: false, // tell jQuery not to set contentType
    }

    options.url =
      '/ajax/scheduler/bulk-schedule-upload?shouldShortenUrls=' + (shouldShortenUrlsInBulk ? 1 : 0)

    this.setState({ isLoading: true })

    trackUploadState(UPLOAD_STATE.BEGIN)

    bulkScheduleUpload(form, shouldShortenUrlsInBulk ? 1 : 0)
      .then((data: BulkScheduleResponse) => {
        this.setState({ isLoading: false })

        if (!data || !data.bulkMessagesResponse) {
          showConfirmationModal({
            titleText: ERROR_FILE,
            bodyText: [ERROR_UNKNOWN].map((m, i) => <p key={`parseError-${i}`}>{m}</p>),
            submitButtonText: OK_CLOSE,
            onSubmit: (close: () => void) => {
              close()
            },
          })
          trackUploadState(UPLOAD_STATE.ERROR)
          return null
        }

        const errors = data.bulkMessagesResponse.errors
        let allErrors
        if (
          typeof errors === 'object' &&
          Object.keys(errors).length > 0 &&
          !errors.scraping &&
          !errors.owly
        ) {
          let header = ERROR_FILE

          allErrors = Object.keys(errors).reduce((acc, category) => {
            errors[category].map(bulkError => {
              acc.push(bulkError.message)
            })
            return acc
          }, [])

          let richError = null
          if (errors.messageCount && errors.messageCount[0] && errors.messageCount[0].details) {
            header = ERROR_TOO_MANY_MESSAGES
            const details = errors.messageCount[0].details
            allErrors = []
            richError = [
              <p key="richError1">
                {RICH_ERROR_1(details.numLinesInCsv, details.numSocialNetworks, details.numMessagesInCsv)}
              </p>,
              <p key="richError2">{RICH_ERROR_2(details.numMessagesPending)}</p>,
              <p key="richError3">{RICH_ERROR_3(details.maxNumMessages, details.numMessagesOver)}</p>,
              <p key="richError4">
                <strong>{RICH_ERROR_4}</strong>
              </p>,
              <p key="richError5">{RICH_ERROR_5}</p>,
            ]
          }
          trackUploadState(UPLOAD_STATE.ERROR)

          showConfirmationModal({
            titleText: header,
            bodyText: (
              <div>
                {allErrors.map((m: string, i: number) => (
                  <p key={`parseError-${i}`}>{m}</p>
                ))}
                {richError}
              </div>
            ),
            submitButtonText: OK_CLOSE,
            onSubmit: (close: () => void) => {
              close()
            },
          })
          return null
        }

        trackUploadState(UPLOAD_STATE.SUCCESS)

        // We succeeded to parse, so will move to the next page
        // Here we add a duplicate history event, which lets us use our onClose popup even when the user hits back
        history.pushState(null, null, '#' + Constants.ROUTES.PUBLISHER.BULK_COMPOSER)
        if (data.bulkMessagesResponse.messages) {
          const returnedMessages = _.map(data.bulkMessagesResponse.messages, (messageData: BulkMessage) => {
            if (Array.isArray(messageData.socialNetworkIds)) {
              messageData.socialNetworksKeyedById = Immutable.OrderedMap(
                messageData.socialNetworkIds.reduce((acc, snId) => {
                  acc[snId] = _.find(socialNetworks, sn => sn.socialNetworkId === snId)
                  return acc
                }, {}),
              )
            }
            delete messageData.socialNetworkIds
            messageData.schedulingRequired = true

            if (messageData.urlPreview) {
              messageData.unEditedUrlPreview = messageData.urlPreview
            }

            messageData.template = messageData.messageText
            delete messageData.messageText

            const message = new Message(messageData)

            message.messages = message.socialNetworksKeyedById
              .map(sn => message.buildMessageFromBase(sn.socialNetworkId, sn.type))
              .toArray()

            const key = 'template'

            // get any duplicate errors reported by the backend
            const duplicateMessageTextErrors =
              message.errors && message.errors[key] ? message.errors[key] : []
            // validate the message fields
            message.validate()
            message.errors = ComposerUtils.mergeErrors(message.errors, messageData.errors)
            // get any errors from the validation
            const validationMessageTextErrors =
              message.errors && message.errors[key] ? message.errors[key] : []
            // if there are any message text errors add them back
            if (validationMessageTextErrors.length !== 0 || duplicateMessageTextErrors.length !== 0) {
              message.errors[key] = duplicateMessageTextErrors.concat(validationMessageTextErrors)
            }

            return message
          })
          this.composerMessageActions.set(returnedMessages)
          this.setState({ composerState: ComposerConstants.STATE.POSTCOMPOSE })
        }

        return null
      })
      .catch((e: Error) => {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.BULK_COMPOSER, 'Failed parsing csv', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
        trackUploadState(UPLOAD_STATE.ERROR)
        this.statusObject.update(ERROR_UPLOAD_FILE, 'error', true)
        this.setState({ isLoading: false })
      })
  }

  updateSelectedSocialNetworks = selectedSocialNetworkIds => {
    this.setState({ selectedSocialNetworkIds })
  }

  setShouldShortenUrlsInBulk = async () => {
    const shouldShortenUrlsInBulk = !this.props.shouldShortenUrlsInBulk
    await savePublisherSetting('shouldShortenUrlsInBulk', shouldShortenUrlsInBulk)
    this.props.dispatch(composerActions.setShouldShortenUrlsInBulk(shouldShortenUrlsInBulk))
  }

  renderWelcomeScreen = () => {
    const {
      timezoneName,
      excludedNetworkTypes,
      fetchDataForBulkComposer,
      privateSocialProfiles,
      shouldShortenUrlsInBulk,
      socialProfilesKeyedByType,
    } = this.props
    return (
      <WelcomeScreen
        excludedNetworkTypes={excludedNetworkTypes}
        fetchDataForBulkComposer={fetchDataForBulkComposer}
        isLoading={this.state.isLoading}
        onNextClicked={this.onNextClicked}
        privateSocialProfiles={privateSocialProfiles}
        selectedSocialNetworkIds={this.state.selectedSocialNetworkIds}
        setShouldShortenUrlsInBulk={this.setShouldShortenUrlsInBulk}
        shouldShortenUrlsInBulk={shouldShortenUrlsInBulk}
        socialProfilesKeyedByType={socialProfilesKeyedByType}
        timezoneName={timezoneName}
        updateSelectedSocialNetworks={this.updateSelectedSocialNetworks}
      />
    )
  }

  renderDoneScreen = () => {
    return [
      <DoneScreen
        key="doneScreen"
        onClose={this.props.onClose}
        onUploadAgain={this.resetToWelcomeScreen}
        onViewMessages={this.props.onViewMessages}
        memberSignupDate={this.props.memberSignupDate}
      />,
    ]
  }

  onManualClose = () => {
    if (isFeatureEnabledOrBeta('PUB_30350_TRACK_MINIMIZE_CLOSE')) {
      track(
        TrackingConstants.TRACKING_ORIGINS.CLOSE,
        TrackingConstants.TRACKING_ACTION.COMPOSER_CLOSE_BUTTON,
        {
          action: 'close',
        },
      )
    }
    // When the user clicks the close button, we need to redirect. We always go to the scheduled page, as a convenience
    this.onClose(true)
  }

  shouldHideOptOut = () => {
    // Users above a certain member ID should not be able to opt out
    if (isFeatureEnabled('PUB_BULK_COMPOSER_FULL_ENABLE_MINIMUM_MEMBER_ID')) {
      let memberIdAsInt = this.props.memberId
      if (typeof this.props.memberId === 'string') {
        memberIdAsInt = parseInt(this.props.memberId, 10)
      }
      const minimumMemberId = parseInt(getFeatureValue('PUB_BULK_COMPOSER_FULL_ENABLE_MINIMUM_MEMBER_ID'), 10)
      return !(isNaN(minimumMemberId) || memberIdAsInt < minimumMemberId)
    } else {
      return false
    }
  }

  onSelectNewOrganization = organization => {
    this.setState({ selectedSocialNetworkIds: [] }, () => this.props.onSelectNewOrganization(organization))
  }

  renderHeader() {
    const { flux, optOut, organizations, selectedOrganization } = this.props
    const canViewOrgPicker =
      organizations &&
      organizations.length > 1 &&
      selectedOrganization &&
      this.state.composerState === ComposerConstants.STATE.PRECOMPOSE

    return (
      <ComposerHeader
        {...{ canViewOrgPicker, flux, optOut }}
        hideBulkComposerOptOut={this.shouldHideOptOut}
        mode={ComposerConstants.MODE.BULK_COMPOSER}
        onClose={this.onManualClose}
        onSelectNewOrganization={this.onSelectNewOrganization}
      />
    )
  }

  // outer div is used to properly scope the css since its all scoped under .hs-app-planner
  // postcss-transform.js
  render() {
    const { composerState, selectedSocialNetworkIds } = this.state
    return (
      <div className="hs-app-composer">
        <div className={BulkComposerConstants.CLASS_NAMES.BULK_COMPOSER}>
          {isFeatureEnabled('PUB_31215_CONVERT_COMPOSER_TO_FUNCTIONAL') ? (
            <ComposerFunctional
              bulkComposerState={{ selectedSocialNetworkIds, composerState }}
              bulkScheduleMessages={this.scheduleMessages}
              csrf={this.props.csrf}
              facadeApiUrl={this.props.facadeApiUrl}
              flux={this.props.flux}
              headerProp={this.renderHeader()}
              ignoredPreviewValidationMessageCodes={this.props.ignoredPreviewValidationMessageCodes}
              isSocialProfileSelectorDisabled={true}
              isUsingLATM={this.props.isUsingLATM}
              memberId={this.props.memberId}
              memberSignupDate={this.props.memberSignupDate}
              mode={ComposerConstants.MODE.BULK_COMPOSER}
              onClose={this.onManualClose}
              onSelectNewOrganization={this.props.onSelectNewOrganization}
              organizations={this.props.organizations}
              postCompose={this.renderDoneScreen}
              preCompose={this.renderWelcomeScreen}
              selectedOrganization={this.props.selectedOrganization}
              sendMessage={this.scheduleSingleMessage}
              socialNetworks={this.props.socialNetworks}
              socialProfilesKeyedByType={this.props.socialProfilesKeyedByType}
              state={this.state.composerState}
              timezoneName={this.props.timezoneName}
              trackingContext={TrackingConstants.TRACKING_CONTEXT.BULK_COMPOSER}
              zIndex={provisionIndex()}
            />
          ) : (
            <Composer
              bulkComposerState={{ selectedSocialNetworkIds, composerState }}
              bulkScheduleMessages={this.scheduleMessages}
              csrf={this.props.csrf}
              facadeApiUrl={this.props.facadeApiUrl}
              flux={this.props.flux}
              header={this.renderHeader()}
              ignoredPreviewValidationMessageCodes={this.props.ignoredPreviewValidationMessageCodes}
              isSocialProfileSelectorDisabled={true}
              isUsingLATM={this.props.isUsingLATM}
              memberId={this.props.memberId}
              memberSignupDate={this.props.memberSignupDate}
              mode={ComposerConstants.MODE.BULK_COMPOSER}
              onClose={this.onManualClose}
              onSelectNewOrganization={this.props.onSelectNewOrganization}
              organizations={this.props.organizations}
              postCompose={this.renderDoneScreen}
              preCompose={this.renderWelcomeScreen}
              selectedOrganization={this.props.selectedOrganization}
              sendMessage={this.scheduleSingleMessage}
              socialNetworks={this.props.socialNetworks}
              socialProfilesKeyedByType={this.props.socialProfilesKeyedByType}
              state={this.state.composerState}
              timezoneName={this.props.timezoneName}
              trackingContext={TrackingConstants.TRACKING_CONTEXT.BULK_COMPOSER}
              zIndex={provisionIndex()}
            />
          )}
        </div>
      </div>
    )
  }
}

const ConnectedBulkComposer = compose(
  reduxConnect(({ composer }: RootState) => ({
    shouldShortenUrlsInBulk: composer.shouldShortenUrlsInBulk,
  })),
  connect(socialProfileStore, (state: SocialProfileState) => ({
    privateSocialProfiles: state.private,
  })),
  connect(composerMessageStore, state => ({
    messages: getMessages(state),
  })),
)(BulkComposer)

export default ConnectedBulkComposer
export { BulkComposer as UnwrappedBulkComposer }
