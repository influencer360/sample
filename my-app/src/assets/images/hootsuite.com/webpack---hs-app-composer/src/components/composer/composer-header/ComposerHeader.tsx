import React from 'react'
import loadable from '@loadable/component'
import { detect } from 'detect-browser'
import get from 'lodash/get'

import styled from 'styled-components'
import { Button } from 'fe-comp-button'
import { P } from 'fe-comp-dom-elements'
import { Popover } from 'fe-comp-popover'
import { connect } from 'fe-hoc-connect'
import { CAMPAIGNS } from 'fe-lib-entitlements'
import { on, off } from 'fe-lib-hootbus'
import { provisionIndex } from 'fe-lib-zindex'
import { minimize } from 'fe-pnc-comp-composer-modal'
import { ComposerHeader as GlobalComposerHeader } from 'fe-pnc-comp-composer-modal'
import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import { TwitterLocationStore, TwitterLocationActions } from 'fe-pnc-comp-location-area'
import { selectedMessageInterface as SelectedMessageState } from 'fe-pnc-data-composer-message'
import { hasEntitlement } from 'fe-pnc-data-entitlements'
import { isFeatureEnabled, isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'

import ComposerConstants from '@/constants/composer'
import { KEYBOARD_SHORTCUTS_EVENTS } from '@/constants/events'
import TrackingConstants from '@/constants/tracking'
import { Flux, Organization, Organizations } from '@/typings/Flux'
import { track } from '@/utils/tracking'
import {
  HeaderLabel,
  HeaderLabelContainer,
  HeaderLabelDivider,
  OptOutButton,
  StyledOrgPicker,
} from './ComposerHeader.style'

// Lazy loaded components
const CampaignSelectDropdown = loadable(
  () =>
    import(
      /* webpackChunkName: "CampaignSelectDropdown" */ '@/components/composer/composer-header/CampaignSelectDropdown'
    ),
)

const noop = () => {}

const CANCEL = translation._('Cancel')
const CONTINUE = translation._('Continue')
const SELECT_DIFF_ORG = translation._('Change organizations?')
const SELECT_DIFF_ORG_BODY_TEXT = translation._('Changing organizations will clear the composer.')
const BULK_COMPOSER = translation._('Bulk Composer')
const RETURN_TO_OLD_BULK_COMPOSER = translation._('Return to the old Bulk Message Uploader')
const NEW_POST = translation._('New post')

interface ComposerHeaderProps {
  canViewOrgPicker?: boolean
  children?: React.ReactElement
  composerConf?: Record<string, unknown>
  facadeApiUrl?: string
  flux: Flux
  FluxComponent?(...args: Array<unknown>): unknown
  hasMessageChanged?(...args: Array<unknown>): unknown
  hideBulkComposerOptOut?(): boolean
  isDraft?: boolean
  isEditingTemplate?: boolean
  isEditMode?: boolean
  memberId: number
  mode: typeof ComposerConstants.MODE.COMPOSER | typeof ComposerConstants.MODE.BULK_COMPOSER
  onClose(): void
  onMinimize?(): void
  optOut?(): void
  onSelectNewOrganization?(organization: Organization): void
  organizations?: Organizations
  selectedOrganization?: Organization
  timezoneName?: string
  maximizeButtonText?: string
}

interface ComposerHeaderState {
  hasCampaignsEntitlement: boolean
}

export default class ComposerHeader extends React.PureComponent<ComposerHeaderProps, ComposerHeaderState> {
  static displayName = 'ComposerHeader'

  static defaultProps = {
    canViewOrgPicker: false,
    hasMessageChanged: noop,
    hideBulkComposerOptOut: noop,
    isDraft: false,
    isEditingTemplate: false,
    isEditMode: false,
    onMinimize: noop,
    optOut: noop,
    onSelectNewOrganization: noop,
    selectedOrganization: {},
    getDataForMinimize: noop,
    maximizeButtonText: translation._('New post'),
  }

  constructor(props: ComposerHeaderProps) {
    super(props)

    this.state = {
      hasCampaignsEntitlement: false,
    }
  }

  componentDidMount() {
    hasEntitlement(this.props.memberId, CAMPAIGNS).then(hasCampaignsEntitlement =>
      this.setState({
        ...this.state,
        hasCampaignsEntitlement,
      }),
    )
    on(KEYBOARD_SHORTCUTS_EVENTS.HIDE_COMPOSER, this.onMinimize)
  }

  componentWillUnmount() {
    off(KEYBOARD_SHORTCUTS_EVENTS.HIDE_COMPOSER, this.onMinimize)
  }

  renderOrganizationReplaceModal = organization => {
    const { hasMessageChanged, onSelectNewOrganization } = this.props

    if (!hasMessageChanged()) {
      onSelectNewOrganization(organization)
      return
    }

    showConfirmationModal({
      titleText: SELECT_DIFF_ORG,
      bodyText: <P>{SELECT_DIFF_ORG_BODY_TEXT}</P>,
      submitButtonText: CONTINUE,
      cancelButtonText: CANCEL,
      onSubmit: close => {
        onSelectNewOrganization(organization)
        close()
      },
    })
  }

  renderBulkComposerContent() {
    const { canViewOrgPicker, optOut, onSelectNewOrganization, hideBulkComposerOptOut } = this.props
    let optOutButton = (
      <OptOutButton onClick={optOut} key="composerOptOutButton">
        {RETURN_TO_OLD_BULK_COMPOSER}
      </OptOutButton>
    )
    if (isFeatureEnabled('PUB_BULK_COMPOSER_REMOVE_BETA')) {
      if (hideBulkComposerOptOut()) {
        optOutButton = null
      }
    }

    return [
      <HeaderLabel key="composerHeaderLabel">{BULK_COMPOSER}</HeaderLabel>,
      canViewOrgPicker && <HeaderLabelDivider key="composerHeaderLabelDivider" />,
      canViewOrgPicker && <StyledOrgPicker {...{ onSelectNewOrganization }} key="composerStyledOrgPicker" />,
      optOutButton,
    ]
  }

  renderContent() {
    const {
      canViewOrgPicker,
      composerConf,
      facadeApiUrl,
      flux,
      FluxComponent,
      isDraft,
      isEditingTemplate,
      onSelectNewOrganization,
      selectedOrganization,
      timezoneName,
    } = this.props
    const { hasCampaignsEntitlement } = this.state

    const headerLabelConf = get(composerConf, ['header', 'label'], '')

    const headerLabel = headerLabelConf || NEW_POST
    const areCampaignsDisabled = get(composerConf, ['header', 'campaigns', 'isDisabled'], false)

    let canViewCampaigns = false
    if (!areCampaignsDisabled) {
      canViewCampaigns = selectedOrganization && hasCampaignsEntitlement && !isEditingTemplate
    }

    let headerLabelContainer
    if (isDraft) {
      const headerIconConf = get(composerConf, ['header', 'icon'], false)
      const headerIcon = headerIconConf ? headerIconConf : null
      headerLabelContainer = (
        <HeaderLabelContainer key="composerHeaderLabel">
          {headerIcon}
          <HeaderLabel hasIcon={headerIcon !== null} draftHeader={true}>
            {headerLabel}
          </HeaderLabel>
        </HeaderLabelContainer>
      )
    } else {
      headerLabelContainer = <HeaderLabel key="composerHeaderLabel">{headerLabel}</HeaderLabel>
    }

    const LocationPopoverWrapper = styled.span`
      position: absolute;

      top: 1%;
      left: ${p => (p.isSafari ? '50%' : '1.75%')};
      transform: ${p => (p.isSafari ? 'translateX(-50%)' : 'none')};

      z-index: ${provisionIndex()};
    `

    const FooterContainer = styled.div`
      text-align: right;
      padding: 0 18px 16px 18px;
    `

    const closePopover = () => TwitterLocationActions.setDisplayPopover(false)

    const PopoverFooter = () => (
      <FooterContainer>
        <Button onClick={closePopover} type="cta">
          {translation._('Ok, got it!')}
        </Button>
      </FooterContainer>
    )

    const LocationPopover = props =>
      props.displayPopover ? (
        <LocationPopoverWrapper className="rc-LocationPopover" isSafari={detect().name === 'safari'}>
          <Popover
            heading={translation._('Improve your location search')}
            hasExitButton={true}
            onExitClick={closePopover}
            position="anchorTop"
            footer={PopoverFooter}
            width="325px"
          >
            {translation._('Click the lock icon in the address bar to change your location permissions.')}
          </Popover>
        </LocationPopoverWrapper>
      ) : null

    const ConnectedLocationPopover = connect(TwitterLocationStore, state => ({
      displayPopover: state.displayPopover,
    }))(LocationPopover)

    return [
      <ConnectedLocationPopover key="composerConnectedLocationPopover" />,
      headerLabelContainer,
      (canViewOrgPicker || canViewCampaigns) && <HeaderLabelDivider key="composerHeaderLabelDivider" />,
      canViewOrgPicker && (
        <StyledOrgPicker
          selectNewOrganizationModal={this.renderOrganizationReplaceModal}
          onSelectNewOrganization={onSelectNewOrganization}
          key="composerStyledOrgPicker"
        />
      ),
      canViewCampaigns && (
        <FluxComponent
          {...{ flux }}
          connectToStores={{
            campaigns: store => ({
              campaigns: store.getActive().toJS(),
            }),
          }}
          key="composerCampaignSelectDropDown"
        >
          <CampaignSelectDropdown
            {...{
              facadeApiUrl,
              timezoneName,
            }}
            organization={selectedOrganization}
          />
        </FluxComponent>
      ),
    ]
  }

  getDataForMinimize() {
    let thumbnailUrl
    const messageText = SelectedMessageState.getMessageText() || null
    const scheduledTime = SelectedMessageState.getSendDate()
    const attachments = SelectedMessageState.getAttachments()

    if (attachments && attachments.length) {
      thumbnailUrl = attachments[0].thumbnailUrl
    }

    return { thumbnailUrl, messageText, scheduledTime }
  }

  onMinimize = () => {
    const { maximizeButtonText, timezoneName } = this.props
    const minimizeData = this.getDataForMinimize()
    const { messageText, scheduledTime, thumbnailUrl } = minimizeData
    if (isFeatureEnabledOrBeta('PUB_30350_TRACK_MINIMIZE_CLOSE')) {
      track(
        TrackingConstants.TRACKING_ORIGINS.MINIMIZE,
        TrackingConstants.TRACKING_ACTION.COMPOSER_MINIMIZE_BUTTON,
      )
    }
    minimize({ header: maximizeButtonText, text: messageText, scheduledTime, timezoneName, thumbnailUrl })
    this.props.onMinimize() // some tracking happens in here that needs to be moved to a better location
  }

  render() {
    const { mode, onClose } = this.props

    return (
      <GlobalComposerHeader
        leftHeaderArea={
          mode === ComposerConstants.MODE.BULK_COMPOSER
            ? this.renderBulkComposerContent()
            : this.renderContent()
        }
        onMinimize={this.onMinimize}
        onClose={onClose}
      />
    )
  }
}
