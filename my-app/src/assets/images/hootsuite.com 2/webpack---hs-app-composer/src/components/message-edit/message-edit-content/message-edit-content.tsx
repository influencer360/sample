import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { OrderedMap } from 'immutable'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import { connect as reduxConnect } from 'react-redux'

import { InputBanner, TYPE_WARNING } from 'fe-comp-input-banner'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { tooltip, PLACEMENT_LEFT } from 'fe-hoc-tooltip'
import { store as composerModalStore } from 'fe-pnc-comp-composer-modal'

import {
  ValidationBanner,
  MessageBodyTooLongError,
  UnlinkedMentionError,
} from 'fe-pnc-comp-field-validation-item'
import type { FieldValidationsType as FieldValidations } from 'fe-pnc-comp-field-validation-item'

import MessageEditToolbarController from 'fe-pnc-comp-message-edit-toolbar-controller'
import { ConnectedMessageEditor as MessageEditor } from 'fe-pnc-comp-message-editor'
import type { InstagramPublishingMode } from 'fe-pnc-constants'
import type {
  SocialNetworkGroup,
  SocialNetworkType,
  InstagramPostType,
} from 'fe-pnc-constants-social-profiles'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import {
  getSelectedMessage,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  selectedMessageInterface as SelectedMessageState,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import type { Mentions } from 'fe-pnc-data-message-previews'
import { isFeatureEnabled, isFeatureEnabledOrBeta, isThreadsEnabled } from 'fe-pnc-lib-darklaunch'
import { useDebounce, useStoreValue } from 'fe-pnc-lib-hooks'
import translation from 'fe-pnc-lib-hs-translation'
import { textContainsMention, createMentionRegex } from 'fe-pnc-lib-mentions'
import { FIELD_VALIDATIONS, FIELD_TYPES } from 'fe-pnc-validation-error-messages'

import MultiNetworkMentionsInfoBanner from '@/components/composer/composer-banners/multi-network-mentions-info-banner'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import Message from '@/models/message'
import { RootState } from '@/redux/store'
import { TrackingContext, ComposerState } from '@/typings/Constants'
import {
  Flux,
  Preset,
  Organization,
  Entitlements,
  Organizations,
  LinkShortners,
  ShortenerConfigs,
} from '@/typings/Flux'
import { LinkSettings } from '@/typings/Message'
import { SocialNetworksKeyedById } from '@/typings/SocialNetwork'
import LinkUtils from '@/utils/link-utils'
import MessageUtils from '@/utils/message-utils'
import PredictiveComplianceUtils from '@/utils/predictive-compliance-utils'
import ValidationUtils from '@/utils/validation-utils'

import FetchLinkSettings from '../../fetch/fetch-link-settings'
import ConnectedMessageTabBar from '../message-tab-bar'
import PostTypeToggle, { shouldShowPostTypeToggle } from '../post-type-toggle'
import {
  BannerContainer,
  Content,
  Header,
  MessageTabBarContainer,
  ValidationContainer,
} from './message-edit-content.style'
import useLinkSettings from './use-link-settings'
import usePredictiveCompliance from './use-predictive-compliance'

const BULK_COMPOSER_MENTIONS_NOT_AVAILABLE = translation._(
  "Facebook and LinkedIn mentions are not supported in bulk composer. You can add Page mentions by editing your posts from Planner after they're scheduled.",
)
export const OVERWRITE_WITH_INITIAL_CONTENT = translation._('Overwrite with initial content')
export const OVERWRITE_CUSTOM_CONTENT = translation._('Overwrite custom social network content')

export const MESSAGE_EDIT_CONTENT = 'message-edit-content'
export const MESSAGE_TAB_BAR = 'message-tab-bar'

export const getContentId = (sn?: SocialNetworkType) => `${MESSAGE_EDIT_CONTENT}${sn ? `-${sn}` : ''}`
export const getTabId = (sn?: SocialNetworkType) => `${MESSAGE_TAB_BAR}${sn ? `-${sn}` : '-content'}`

const isFacebookOrLinkedIn = socialNetwork =>
  socialNetwork.type === SocialProfileConstants.SN_TYPES.FACEBOOKPAGE ||
  socialNetwork.type === SocialProfileConstants.SN_TYPES.LINKEDIN ||
  socialNetwork.type === SocialProfileConstants.SN_TYPES.LINKEDINCOMPANY

const CODE_MESSAGE_TOO_LONG = 4214

interface MessageEditContentProps {
  campaignId: string
  children: ReactNode
  entitlements: Entitlements
  fetchPreviewData(): void
  flux: Flux
  hasSingleNetworkAndMultipleUnlinkedMentions: boolean
  isBulkComposer: boolean
  isSequentialPostingInProgress: boolean
  labelText: string
  linkShorteners: LinkShortners
  linkShortenersDeprecated: LinkShortners
  messageText: string
  multiNetworkMentionSnTypes: Array<SocialNetworkType>
  onApplyLinkSettings: (
    linkSettings: LinkSettings,
    trackingData?: { shortener?: number; tracking?: string },
  ) => void
  onChangePreset: (selectedPreset: Preset) => void
  onChangeText: (
    newText: string,
    newMentions: Mentions,
    newTemplate?: string,
    selectedNetworkGroup?: SocialNetworkGroup,
  ) => void
  onScrapeLink: (text: string) => void
  organizations: Organizations
  placeholder: string
  presets: Array<Preset>
  searchMentionsDebounceTimeout: number
  selectedMessage: Message
  selectedNetworkGroup: SocialNetworkGroup
  selectedOrganization: Organization | null
  shortenerConfigsDeprecated: ShortenerConfigs // Remove with PUB_30814_LINK_PRESETS_USE_REDUX
  shortenerConfigs: ShortenerConfigs
  showOnSubmitErrorsProp: boolean
  socialNetworkTypesForCounting: Array<SocialNetworkType>
  socialNetworksKeyedById: SocialNetworksKeyedById
  template: string
  trackingContext: TrackingContext
  verifyMentionsDebounceTimeout: number
  snGroupsWithUnlinkedMention: Array<string>
  onMentionSearchProgressChange(isSearchInProgress: boolean): void
  isInstagramStory: boolean
  onClickHashtagButton: () => void
  onClickAIButton: () => void
  isPreviewChanged: boolean //currently not used, it will be used for the animation of the hashtag button PROM-5309
  selectedMessageId: string | number
  postType: InstagramPostType
  publishingMode: InstagramPublishingMode
  isHashtagAccessAllowed: boolean
  isHashtagDisabled
  isPinterest: boolean
}

const MessageEditContent = ({
  campaignId,
  children,
  entitlements,
  fetchPreviewData,
  flux,
  hasSingleNetworkAndMultipleUnlinkedMentions = false,
  isBulkComposer,
  isSequentialPostingInProgress,
  labelText = 'Text',
  linkShortenersDeprecated = [],
  linkShorteners = [],
  multiNetworkMentionSnTypes,
  onApplyLinkSettings,
  onChangePreset,
  onChangeText,
  placeholder,
  presets,
  selectedNetworkGroup,
  onScrapeLink = () => {},
  organizations = [],
  searchMentionsDebounceTimeout = 250,
  selectedOrganization = null,
  selectedMessage,
  shortenerConfigs = [],
  shortenerConfigsDeprecated = [], // Remove with PUB_30814_LINK_PRESETS_USE_REDUX
  showOnSubmitErrorsProp = false,
  socialNetworkTypesForCounting = [],
  socialNetworksKeyedById = OrderedMap(),
  template,
  trackingContext,
  verifyMentionsDebounceTimeout = 250,
  snGroupsWithUnlinkedMention,
  onMentionSearchProgressChange,
  onClickHashtagButton,
  onClickAIButton,
  postType,
  publishingMode,
  isHashtagAccessAllowed = false,
  isHashtagDisabled = false,
  isPinterest = false,
}: MessageEditContentProps) => {
  const mentionsRegex = useMemo(() => createMentionRegex(), [])
  const [isFocused, setIsFocused] = useState(false)
  const editorRef = useRef(null)
  const { linkSettings, selectedPreset } = useLinkSettings()

  const getFieldValidations = composerMessageStoreState =>
    getSelectedMessageValue(composerMessageStoreState, 'fieldValidations', false, {})

  const isAllOwnerTypesPrivate: boolean =
    PredictiveComplianceUtils.getIsAllOwnerTypesPrivate(socialNetworksKeyedById)

  const showOnSubmitErrors = showOnSubmitErrorsProp

  const fieldValidations = useStoreValue(
    composerMessageStore,
    getFieldValidations,
    isEqual,
  ) as FieldValidations

  const fieldValidationsPerNetwork = SelectedMessageState.getValidationsBySelectedNetwork(
    getComposerMessageState(),
    socialNetworkTypesForCounting.length > 1 ? selectedNetworkGroup : null,
  ) as FieldValidations

  const hasFieldValidationErrors = ValidationUtils.hasErrorsByField(
    fieldValidationsPerNetwork,
    FIELD_VALIDATIONS.TEMPLATE,
    showOnSubmitErrors,
  )

  const shouldShowUnlinkedMentionBanner =
    !isBulkComposer &&
    (snGroupsWithUnlinkedMention?.includes(selectedNetworkGroup) ||
      (!isEmpty(snGroupsWithUnlinkedMention) && isNil(selectedNetworkGroup)))

  const shouldShowMultiNetworkMentionsInfoBanner =
    multiNetworkMentionSnTypes?.includes(
      SocialProfileConstants.SN_GROUP_TO_DISPLAY_NAME[selectedNetworkGroup],
    ) ||
    (!isEmpty(multiNetworkMentionSnTypes) && isNil(selectedNetworkGroup))

  const shouldShowMessageBodyTooLongError =
    fieldValidationsPerNetwork?.errors &&
    fieldValidationsPerNetwork.errors[FIELD_VALIDATIONS.TEMPLATE]?.some(
      error => error.code === CODE_MESSAGE_TOO_LONG,
    )

  const showValidationErrors =
    hasFieldValidationErrors ||
    shouldShowMessageBodyTooLongError ||
    shouldShowUnlinkedMentionBanner ||
    shouldShowMultiNetworkMentionsInfoBanner

  const validationErrors = showValidationErrors ? (
    <ValidationContainer>
      {hasFieldValidationErrors && (
        <ValidationBanner
          field={FIELD_VALIDATIONS.TEMPLATE}
          type={FIELD_TYPES.TEXT}
          isBulkComposer={isBulkComposer}
          showOnSubmitErrors={showOnSubmitErrors}
          isPageLevel={true}
          fieldValidations={ValidationUtils.removeMessageBodyTooLongErrors(fieldValidationsPerNetwork)}
        />
      )}
      {shouldShowMessageBodyTooLongError && (
        <BannerContainer>
          <MessageBodyTooLongError errors={fieldValidationsPerNetwork.errors} />
        </BannerContainer>
      )}
      {shouldShowUnlinkedMentionBanner && (
        <BannerContainer>
          <UnlinkedMentionError
            snGroupsWithUnlinkedMention={snGroupsWithUnlinkedMention}
            hasSingleNetworkAndMultipleUnlinkedMentions={hasSingleNetworkAndMultipleUnlinkedMentions}
          />
        </BannerContainer>
      )}
      {shouldShowMultiNetworkMentionsInfoBanner && (
        <BannerContainer>
          <MultiNetworkMentionsInfoBanner snNames={multiNetworkMentionSnTypes} />
        </BannerContainer>
      )}
    </ValidationContainer>
  ) : null

  const {
    isEnabled: isPredictiveComplianceEnabled,
    indicator: predictiveComplianceIndicator,
    banner: predictiveComplianceBanner,
  } = usePredictiveCompliance({
    text: MessageUtils.getAllMessageText(selectedMessage).join(' '),
    isFocused,
    organizationId: selectedOrganization?.organizationId || null,
    enablePredictiveCompliance: isAllOwnerTypesPrivate === false,
  })
  const { isMinimized } = useStoreValue(composerModalStore, (state: ComposerState) => state)
  const isFacebookOrLinkedInSelected = useMemo(
    () => Boolean(socialNetworksKeyedById.toArray().find(isFacebookOrLinkedIn)),
    [socialNetworksKeyedById],
  )

  // Show overwrite content button if on Content tab and at least one network message was customized
  // OR
  // if on network tab and message text is different from the base message
  const hasContentDiverged: boolean =
    template !== selectedMessage?.baseMessage.template ||
    LinkUtils.haveLinkSettingsDiverged(
      selectedMessage.baseMessage,
      MessageUtils.getInnerMessageFromGroup(selectedMessage.messages, selectedNetworkGroup),
    )

  let showOverwriteContentButton =
    selectedNetworkGroup === null
      ? MessageUtils.isPerNetworkMessageCustomized(selectedMessage)
      : hasContentDiverged

  if (isFeatureEnabled('PUB_29939_HIDE_OVERWRITE_CONTENT') && socialNetworkTypesForCounting.length <= 1) {
    showOverwriteContentButton = false
  }

  const messageFromTemplate = MessageUtils.buildMessageFromTemplate(
    selectedMessage.template,
    selectedMessage.linkSettings,
    selectedMessage?.getAllMentions(selectedNetworkGroup),
  )
  const currentMentions = messageFromTemplate.mentions
  const messageEditorValue = messageFromTemplate.messageText

  const snType =
    socialNetworkTypesForCounting?.find(snType => {
      return MessageUtils.isNetworkTypeInGroup(snType, selectedNetworkGroup)
    }) || null

  useEffect(() => {
    if (isSequentialPostingInProgress && template !== '') {
      setTimeout(() => typeof editorRef?.current?.focus === 'function' && editorRef.current.focus(), 0)
    }
  }, [isSequentialPostingInProgress, template])

  const renderPostTypeToggle = () => {
    const selectedProfileIds = selectedMessage?.getSocialNetworkIds() || []
    const selectedNetworkTypes = selectedMessage.getSocialNetworkTypes()
    if (shouldShowPostTypeToggle(selectedNetworkGroup, isBulkComposer)) {
      return (
        <PostTypeToggle
          selectedProfileIds={selectedProfileIds}
          selectedNetworkTypes={selectedNetworkTypes}
          entitlements={entitlements}
        />
      )
    }
  }

  const changeHandler = (nextValue, nextMentions, nextTemplate = '') => {
    onChangeText(nextValue, nextMentions, nextTemplate, selectedNetworkGroup)
  }

  const handleOverwriteContent = (event: MouseEvent) => {
    event.stopPropagation()
    if (selectedNetworkGroup === null) {
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        selectedMessage.resetFields(
          Message.MESSAGE_FIELDS.template,
          Message.INNER_MESSAGE_FIELDS.mentions,
          Message.INNER_MESSAGE_FIELDS.linkSettings,
          Message.INNER_MESSAGE_FIELDS.linkSettingsPresetId,
        )
      } else {
        selectedMessage.resetFields(Message.MESSAGE_FIELDS.template, Message.INNER_MESSAGE_FIELDS.mentions)
      }
    }

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      selectedMessage.resetFields(
        Message.INNER_MESSAGE_FIELDS.linkSettings,
        Message.INNER_MESSAGE_FIELDS.linkSettingsPresetId,
        Message.INNER_MESSAGE_FIELDS.unEditedUrlPreview,
        Message.INNER_MESSAGE_FIELDS.linkPreview,
      )
    }
    const baseMessageText = MessageUtils.mapTemplateToMessageWithLinks(
      selectedMessage.baseMessage.template,
      selectedMessage.baseMessage.linkSettings,
    ).message
    onChangeText(baseMessageText, [], selectedMessage.baseMessage.template || '', selectedNetworkGroup)

    // Re-fetch previews
    fetchPreviewData()
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      onScrapeLink(selectedMessage.renderMessageText())
    }
  }

  const onFocus = isPredictiveComplianceEnabled ? () => setIsFocused(true) : undefined
  const onBlur = isPredictiveComplianceEnabled ? () => setIsFocused(false) : undefined
  const onTabBarMouseDown = isPredictiveComplianceEnabled
    ? (event: MouseEvent) => {
        // Prevents the 'onBlur' event when switching tabs
        event.preventDefault()
      }
    : undefined

  const overwriteText =
    selectedNetworkGroup === null ? OVERWRITE_CUSTOM_CONTENT : OVERWRITE_WITH_INITIAL_CONTENT

  const selectedProfileIds = selectedMessage?.getSocialNetworkIds() || []

  // Debounce of 0 ensures that the editor takes render priority over the counter to reduce typing lag
  const messageLength = useDebounce(selectedMessage.getMessageLength(snType), 0)

  const renderToolbar = ({ insertText }) => (
    <MessageEditToolbarController
      onClickEmoji={(emoji, e) => {
        e.stopPropagation()
        if (isFeatureEnabled('PUB_30408_EMOJI_PICKER_REACT')) {
          insertText(emoji.emoji)
        } else {
          insertText(emoji.native)
        }
      }}
      campaignId={campaignId}
      entitlements={entitlements}
      isBulkComposer={isBulkComposer}
      isSeamlessUX={true}
      linkShorteners={
        isFeatureEnabled('PUB_30814_LINK_PRESETS_USE_REDUX') ? linkShorteners : linkShortenersDeprecated
      }
      onChangePreset={onChangePreset}
      onLinkSettingsChange={onApplyLinkSettings}
      shortenerConfigs={
        isFeatureEnabled('PUB_30814_LINK_PRESETS_USE_REDUX') ? shortenerConfigs : shortenerConfigsDeprecated
      }
      trackingContext={trackingContext}
      linkSettings={Array.isArray(linkSettings) ? linkSettings : []}
      organizations={organizations}
      selectedOrganization={selectedOrganization}
      linkSettingsPresetId={selectedPreset}
      campaigns={flux.getStore('campaigns').get()}
      linkSettingsPresets={
        isFeatureEnabled('PUB_30814_LINK_PRESETS_USE_REDUX') ? presets : flux.getStore('presets').get() || []
      }
      overwriteContentProps={{
        ariaLabel: overwriteText,
        isBaseContentTabSelected: selectedNetworkGroup === null,
        onMouseDown: handleOverwriteContent,
        shouldAllowOverwriteContent: showOverwriteContentButton,
        tooltip: tooltip(({ children }) => children, {
          text: overwriteText,
          placement: PLACEMENT_LEFT,
          zIndex: 10000,
        }),
      }}
      mentionsButtonProps={{
        shouldShowMentionsButton: selectedNetworkGroup !== null,
        onClickMentionsButton: e => {
          e.stopPropagation()
          insertText('@', true)
        },
      }}
      hashtagButtonProps={{
        shouldShowHashtagButton: isThreadsEnabled()
          ? !isHashtagDisabled && snType !== SocialProfileConstants.SN_TYPES.THREADS
          : !isHashtagDisabled,
        isHashtagAccessAllowed: isHashtagAccessAllowed,
        onClickHashtagButton: onClickHashtagButton,
        showAnimation: false,
      }}
      characterCounterProps={{
        actualMessageLength: isFeatureEnabled('PUB_28850_EDITOR_TOOLBAR_PERFORMANCE')
          ? messageLength
          : SelectedMessageState.getMessageLength(snType),
        maxMessageLength: snType ? SocialProfileConstants.SN_TYPE_TO_MAX_MESSAGE_LENGTH[snType] : undefined,
        socialNetworkType: snType,
      }}
      aiButtonProps={{
        shouldShowAIButton:
          isFeatureEnabledOrBeta('PUB_30556_AI_ON_COMPOSER') &&
          selectedNetworkGroup &&
          !!selectedMessage.template,
        onClickAIButton,
      }}
    />
  )

  return (
    <div className="rc-MessageEditContent rc-MessageEditText">
      <Header>
        <FetchLinkSettings organizationId={selectedOrganization?.organizationId} />
        <MessageTabBarContainer>
          <ConnectedMessageTabBar
            isBulkComposer={isBulkComposer}
            selectedNetworkGroup={selectedNetworkGroup}
            onMouseDown={onTabBarMouseDown}
            perNetworkErrorCodes={ValidationUtils.getPerNetworkErrorCodes(
              fieldValidations,
              showOnSubmitErrors,
            )}
            selectedProfileIds={selectedProfileIds}
            snGroupsWithUnlinkedMention={snGroupsWithUnlinkedMention}
            postType={postType}
            publishingMode={publishingMode}
          />
          {predictiveComplianceIndicator}
        </MessageTabBarContainer>
        {renderPostTypeToggle()}
      </Header>
      <Content
        aria-labelledby={getTabId(selectedNetworkGroup)}
        id={getContentId(selectedNetworkGroup)}
        role={'tabpanel'}
      >
        {validationErrors}
        <MessageEditor
          ariaLabel={labelText}
          ref={editorRef}
          errorState={false}
          loggingCategory={LOGGING_CATEGORIES.NEW_COMPOSER}
          onFocus={() => {
            onFocus && onFocus()
          }}
          onBlur={onBlur}
          onChange={changeHandler}
          selectedNetworkGroup={selectedNetworkGroup}
          onMentionSearchProgressChange={onMentionSearchProgressChange}
          renderToolbar={renderToolbar}
          isMentionsEnabled={!isBulkComposer}
          isSeamlessUX={true}
          selectedProfileIds={selectedProfileIds}
          {...{
            value: messageEditorValue,
            mentions: currentMentions,
            onScrapeLink,
            placeholder,
            searchMentionsDebounceTimeout,
            verifyMentionsDebounceTimeout,
            trackingContext,
          }}
          isMinimized={isMinimized}
          isPinterest={isPinterest}
        />
        {predictiveComplianceBanner}
        {isBulkComposer &&
          isFacebookOrLinkedInSelected &&
          textContainsMention(selectedMessage.renderMessageText(), mentionsRegex) && (
            <InputBanner type={TYPE_WARNING} messageText={BULK_COMPOSER_MENTIONS_NOT_AVAILABLE} />
          )}
        {/* Media Area */}
        {children}
      </Content>
    </div>
  )
}

MessageEditContent.displayName = 'Message Edit Content'

const DefaultExport = compose(
  reduxConnect(({ composer, validation, linkSettings }: RootState) => ({
    isSequentialPostingInProgress: composer.isSequentialPostingInProgress,
    selectedNetworkGroup: composer.selectedNetworkGroup,
    showOnSubmitErrorsProp: validation.showOnSubmitErrors,
    presets: linkSettings.presets,
    shortenerConfigs: linkSettings.shortenerConfigs,
    linkShorteners: linkSettings.linkShorteners,
  })),
  connect(composerMessageStore, state => ({
    messageText: getSelectedMessageValue(state, 'messageText', false, ''),
    postType: getSelectedMessageValue(state, 'postType', false, ''),
    publishingMode: getSelectedMessageValue(state, 'publishingMode', false, ''),
    selectedMessage: getSelectedMessage(state),
    template: getSelectedMessageValue(state, 'template', false, ''),
  })),
)(React.memo(MessageEditContent))

export default DefaultExport
export { MessageEditContent as MessageEditContentComponent }
