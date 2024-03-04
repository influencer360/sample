import React from 'react'

import { isEmpty } from 'lodash'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'

import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { getStore as getMessagePreviewsStore } from 'fe-pnc-data-message-previews'
import type { MessageValidationError, PreviewsState } from 'fe-pnc-data-message-previews'
import { observeStore } from 'fe-pnc-lib-store-observer'
import { FIELD_VALIDATIONS, FIELD_TYPES } from 'fe-pnc-validation-error-messages'

import { IGNORED_PREVIEW_WARNINGS } from '@/constants/preview-validation-messages'

const noop = () => {}
const DEFAULT_WARNINGS = []
const DEFAULT_INFO = []

interface MessagePreviewFooterState {
  info: Array<MessageValidationError>
  warnings: Array<MessageValidationError>
  ignoredPreviewValidationMessageCodes: Array<number>
}

interface MessagePreviewFooterProps {
  ignoredPreviewValidationMessageCodes?: Array<string>
  isBulkComposer?: boolean
  onAddIgnoredPreviewValidationMessageCode(code: number): void
  socialProfileType?: string
  previewIndex: number
}

export default class MessagePreviewFooter extends React.Component<
  MessagePreviewFooterProps,
  MessagePreviewFooterState
> {
  static displayName = 'Message Preview Footer'
  unobserve: Array<() => void> = []

  static defaultProps = {
    previewIndex: -1,
    ignoredPreviewValidationMessageCodes: [],
    isBulkComposer: false,
    onAddIgnoredPreviewValidationMessageCode: () => {},
  }

  constructor(props) {
    super(props)

    this.state = {
      info: DEFAULT_INFO,
      warnings: DEFAULT_WARNINGS,
      ignoredPreviewValidationMessageCodes: props.ignoredPreviewValidationMessageCodes,
    }

    this.unobserve = [noop]
  }

  componentDidMount() {
    this.unobserve = [
      observeStore(
        getMessagePreviewsStore(),
        (warningsAndInfo: {
          warnings: Array<MessageValidationError>
          info: Array<MessageValidationError>
        }) => {
          const { warnings = [], info = [] } = warningsAndInfo
          if (!isEqual(warnings, this.state.warnings) || !isEqual(info, this.state.info)) {
            this.setState({ warnings, info })
          }
        },
        (state: PreviewsState) => {
          const preview = get(state, `previewMessages.${this.props.previewIndex}`, {})
          const { warnings, info } = preview
          return { warnings, info }
        },
        isEqual,
      ),
    ]
  }

  componentWillUnmount() {
    over(this.unobserve)()
  }

  /**
   * Ignores a preview validation message code
   * @param code The code of the message to ignore
   */
  onIgnorePreviewValidationMessageCode = (code: number) => {
    const { ignoredPreviewValidationMessageCodes } = this.state
    if (!ignoredPreviewValidationMessageCodes.includes(code)) {
      this.setState({ ignoredPreviewValidationMessageCodes: [...ignoredPreviewValidationMessageCodes, code] })
      // Updates code in publishSettings to persist across sessions
      this.props.onAddIgnoredPreviewValidationMessageCode(code)
    }
  }

  render() {
    const { socialProfileType } = this.props
    return !socialProfileType || socialProfileType !== SocialProfileConstants.SN_TYPES.PINTEREST ? (
      <div className={'rc-MessagePreviewFooter'}>
        <ValidationBanner
          fieldValidations={{
            ...(!isEmpty(this.state.warnings) && {
              warnings: {
                [FIELD_VALIDATIONS.SOCIAL_NETWORK]: this.state.warnings.filter(
                  warning => !Object.values(IGNORED_PREVIEW_WARNINGS).includes(warning.code),
                ),
              },
            }),
            ...(!isEmpty(this.state.info) && {
              info: {
                [FIELD_VALIDATIONS.SOCIAL_NETWORK]: this.state.info.filter(
                  info =>
                    !this.state.ignoredPreviewValidationMessageCodes.some(
                      ignoredCode => info.code === ignoredCode,
                    ),
                ),
              },
            }),
          }}
          field={FIELD_VALIDATIONS.SOCIAL_NETWORK}
          type={FIELD_TYPES.SOCIAL_NETWORK}
          isBulkComposer={this.props.isBulkComposer}
          isPageLevel={true}
          showOnSubmitErrors={false}
          ignoredValidationTypes={[]}
          errorProps={{
            shouldHideTitle: true,
            onBannerDismiss: this.onIgnorePreviewValidationMessageCode,
          }}
        />
      </div>
    ) : null
  }
}
