import React, { useRef } from 'react'

import loadable from '@loadable/component'
import { ViewportList } from 'react-viewport-list'
import styled from 'styled-components'
import { includes } from 'underscore'

import { withHsTheme, getThemeValue } from 'fe-lib-theme'

import { Loader } from '@/components/loader'
import Message from '@/models/message'

// Lazy loaded components
const MessageSelectionHeader = loadable(
  () =>
    import(
      /* webpackChunkName: "MessageSelectionHeader" */ '@/components/composer/message-selection-header/message-selection-header'
    ),
)
MessageSelectionHeader.displayName = 'MessageSelectionHeader' // The displayName is needed for finding the component in the unit tests
const MessageItem = loadable(async () => {
  const { MessageItemFunctional } = await import(/* webpackChunkName: "MessageItem" */ './message-item')

  return props => <MessageItemFunctional {...props} />
})
MessageItem.displayName = 'MessageItem'

interface Props {
  allMessagesSelected: boolean
  loadMore(): void
  maxMessages: number
  messages: Array<Message>
  multipleSelectMode?: boolean
  numberOfErrors: number
  onDiscard(messageId: number): void
  onEditSelect(messageId: number): void
  onSelect(messageId: number): void
  onSelectAll(): void
  selectedMessageForEditId?: number
  selectedMessageIds: Array<number>
  timezoneName?: string
}

const LOADER_BG_COLOUR = '#e5e6e7'

export const MessageColumn = withHsTheme(styled.div`
  background-color: ${() => getThemeValue(t => t.colors.lightGrey40)};
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex: 1 1 auto;
  min-height: 0;
`)

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`

export const MessageDashboard = ({
  allMessagesSelected,
  maxMessages,
  messages = [],
  multipleSelectMode = false,
  numberOfErrors,
  onDiscard,
  onEditSelect,
  onSelect,
  onSelectAll,
  selectedMessageForEditId = null,
  selectedMessageIds = [],
  timezoneName,
  loadMore,
}: Props) => {
  const MessageListRef = useRef()

  const onScroll = event => {
    const node = event?.currentTarget
    if (node) {
      const scrollPercentage = (node.scrollTop + node.offsetHeight) / node.scrollHeight
      if (scrollPercentage > 0.99) {
        loadMore()
      }
    }
  }

  return (
    <MessageColumn className="rc-MessageDashboard">
      {selectedMessageIds.length > 0 ? (
        ''
      ) : (
        <MessageSelectionHeader
          {...{ allMessagesSelected, numberOfErrors, onSelectAll }}
          fallback={<Loader backgroundColour={LOADER_BG_COLOUR} height="64px" isAbsolutePositioned={false} />}
          numberOfMessages={maxMessages} // the header is not aware that we lazy load, so we send all messages
          numberOfMessagesSelected={selectedMessageIds.length}
        />
      )}
      <MessageList className="scroll-container -messageList" ref={MessageListRef} onScroll={onScroll}>
        <ViewportList items={messages}>
          {(message, index) => {
            const messageId = message.id
            const isSelectedForEdit = selectedMessageForEditId === message.id && selectedMessageIds.length < 1
            const socialNetworks = message?.socialNetworksKeyedById.toArray()

            return (
              <MessageItem
                {...{ isSelectedForEdit, message, onDiscard, onEditSelect, onSelect, timezoneName }}
                fallback={
                  <Loader backgroundColour={LOADER_BG_COLOUR} height="170px" isAbsolutePositioned={false} />
                }
                index={index + 1}
                isSelected={allMessagesSelected || includes(selectedMessageIds, message.id)}
                key={messageId}
                messageKey={messageId}
                multipleSelectMode={multipleSelectMode}
                numberOfMessages={maxMessages}
                socialNetworks={socialNetworks}
              />
            )
          }}
        </ViewportList>
      </MessageList>
    </MessageColumn>
  )
}
