import React from 'react'
import { useDispatch as reduxUseDispatch } from 'react-redux'
import { connect as reduxConnect } from 'react-redux'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import HashtagPanel from 'fe-pnc-comp-hashtags-suggestion-pane'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import { store as composerMessageStore } from 'fe-pnc-data-composer-message'
import type InnerMessage from '@/models/inner-message'
import { composerActions } from '@/redux/reducers/composer'
import { RootState } from '@/redux/store'
import MessageUtils from '@/utils/message-utils'
import { track } from '@/utils/tracking'

const useDispatch = reduxUseDispatch

type HashtagSuggestionPanelProps = {
  messages: Array<any>
  onToggleHashtagPanel: () => void
  selectedNetworkGroup?: SocialNetworkGroup | null
}
const HashtagSuggestionPanel: React.FunctionComponent<HashtagSuggestionPanelProps> = ({
  onToggleHashtagPanel = () => null,
  messages = [],
  selectedNetworkGroup = null,
}: HashtagSuggestionPanelProps) => {
  const reduxDispatch = useDispatch()

  const onTrack = (eventTracking: string, data?: Record<string, unknown>) => {
    track('web.content.hashtag_suggestions', eventTracking, data)
  }

  const setAcceptedHashtagSuggestion = suggestion => {
    reduxDispatch(composerActions.setAcceptedHashtagSuggestion(suggestion))
  }

  const filterMessage = () => {
    const baseMessage = messages?.[0]?.baseMessage
    if (selectedNetworkGroup) {
      const message: InnerMessage = MessageUtils.getInnerMessageFromGroup(
        messages?.[0]?.messages,
        selectedNetworkGroup,
      )

      const attachments = MessageUtils.getAttachmentsBySelectedNetwork(
        messages?.[0]?.messages,
        selectedNetworkGroup,
      )

      const text = MessageUtils.mapTemplateToMessageWithMentions(
        message?.template || '',
        message?.mentions,
      ).message

      return {
        text: text,
        attachments: attachments,
        linkSettings: message?.linkSettings,
      }
    } else {
      return {
        text: baseMessage?.template,
        attachments: baseMessage?.attachments,
        linkSettings: baseMessage?.linkSettings,
      }
    }
  }

  return (
    <HashtagPanel
      onClose={onToggleHashtagPanel}
      onTrack={onTrack}
      message={filterMessage()}
      messages={messages}
      setAcceptedHashtagSuggestion={setAcceptedHashtagSuggestion}
    />
  )
}

export default compose(
  connect(composerMessageStore, (state: any) => ({
    messages: state.messages,
  })),
  reduxConnect(({ composer }: RootState) => ({
    selectedNetworkGroup: composer.selectedNetworkGroup,
  })),
)(HashtagSuggestionPanel)
