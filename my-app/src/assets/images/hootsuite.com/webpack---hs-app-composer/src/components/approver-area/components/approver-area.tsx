import React, { useEffect, useCallback, useRef, useState } from 'react'

import { Banner, TYPE_INFO } from 'fe-comp-banner'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { withI18n } from 'fe-lib-i18n'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import { LazyRenderCombobox } from 'fe-pnc-comp-lazy-render-combobox'
import {
  actions as ComposerMessageActions,
  getSelectedMessage,
  getSelectedMessageValue,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import { store as socialProfileStore } from 'fe-pnc-data-social-profiles-v2'
import type { SocialProfileState } from 'fe-pnc-data-social-profiles-v2'
import { FIELD_VALIDATIONS, FIELD_TYPES, CUSTOM_ERRORS } from 'fe-pnc-validation-error-messages'

import { TitleText } from '@/components/composer/composer-panels/message-edit-area/title-text'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import TrackingConstants from '@/constants/tracking'
import { Approver, ApproverAreaProps } from '@/typings/Approver'
import { track } from '@/utils/tracking'
import ValidationUtils, { InvalidApproverSelected } from '@/utils/validation-utils'
import { fetchApproversBySnIds } from '../api'
import ApproverComp from './approver'
import { Header, Subtitle } from './approver-area.styles'

const MAX_PILLS_TO_DISPLAY = 1

export const ApproverArea: React.FC<ApproverAreaProps> = ({
  $i18n,
  memberId,
  socialProfileIds,
  onApproverSelected,
  isDisabledState,
  fieldValidations,
  selectedMessageForEdit,
  privateSocialProfiles,
}) => {
  const [approvers, setApprovers] = useState([])
  const [query, setQuery] = useState('')
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false)
  const [selectedApprover, setSelectedApprover] = useState(null)

  const comboboxRef = useRef(null)

  useEffect(() => {
    const isPrivateSocialProfileSelected = () => {
      if (privateSocialProfiles?.length) {
        const privateSocialProfileIds = privateSocialProfiles.map(profile => profile.socialProfileId)
        return socialProfileIds.some(id => privateSocialProfileIds.includes(id))
      }
      return false
    }

    const getApproversData = async () => {
      if (isPrivateSocialProfileSelected()) {
        setApprovers([])
        setSelectedApprover(null)
      } else {
        const approvers = await fetchApproversBySnIds(socialProfileIds)
        setApprovers(approvers)

        let reviewerIndex = -1
        if (selectedMessageForEdit?.oneTimeReviewerId) {
          reviewerIndex = approvers.findIndex(
            approver => approver.memberId === selectedMessageForEdit.oneTimeReviewerId,
          )
        }

        if (!isInitialDataLoaded) {
          setSelectedApprover(reviewerIndex >= 0 ? approvers[reviewerIndex] : null)
        }
      }

      if (!isInitialDataLoaded) {
        setIsInitialDataLoaded(true)
      }
    }

    getApproversData()
  }, [isInitialDataLoaded, socialProfileIds])

  const onOpenDropdown = useCallback(() => {
    track(
      TrackingConstants.TRACKING_ORIGINS.NEW,
      TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.CLICK_APPROVAL,
    )
    setQuery('')
  }, [])

  const onQuery = useCallback(
    async (searchQuery: string) => {
      const newQuery = searchQuery.trim()
      if (newQuery !== query) {
        setQuery(newQuery.toLowerCase())
      }
    },
    [query],
  )

  const onPillRemoval = useCallback(() => {
    setSelectedApprover(null)
  }, [])

  useEffect(() => {
    if (!isInitialDataLoaded) {
      return
    }

    const setInvalidOneTimeReviewer = isInvalid => {
      const updatedFieldValidations = isInvalid
        ? ValidationUtils.addCustomValidations(
            fieldValidations,
            [InvalidApproverSelected],
            FIELD_VALIDATIONS.ONE_TIME_REVIEWER,
            ComposerConstants.ERROR_LEVELS.ERRORS,
          )
        : ValidationUtils.removeErrors(fieldValidations, [
            CUSTOM_ERRORS.FE_INVALID_ONE_TIME_REVIEWER_SELECTED,
          ])

      ComposerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
        updatedFieldValidations,
      )
    }

    const isSelectedApproverAvailable = () => {
      // If the selected approver is the current user clear the selection and not in edit mode (disabled)
      // e.g. duplicating a post from Planner where the current user is the selected approver
      if (selectedApprover?.memberId === memberId && !isDisabledState) {
        setSelectedApprover(null)
      } else {
        const selectedApproverId = selectedApprover ? selectedApprover.memberId : null

        onApproverSelected(selectedApproverId)

        const invalidApproverSelected =
          !approvers.some(app => app.memberId === selectedApproverId) && selectedApprover !== null
        if (selectedMessageForEdit) setInvalidOneTimeReviewer(invalidApproverSelected)
      }
    }

    isSelectedApproverAvailable()
  }, [approvers, isInitialDataLoaded, onApproverSelected, selectedApprover])

  const getActivePills = useCallback(() => {
    let pills = []
    const mapPillsCb = approver => {
      approver.active = approver.memberId === selectedApprover?.memberId ? true : false
      return approver
    }
    if (!!query) {
      pills = approvers.filter(approver => approver.title?.toLowerCase().includes(query)).map(mapPillsCb)
    } else {
      pills = approvers.map(mapPillsCb)
    }

    if (!pills.some(pill => pill.active) && selectedApprover) {
      pills.push({ ...selectedApprover, active: true })
    }

    return pills
  }, [approvers, query, selectedApprover])

  const isVisibleItem = useCallback(
    approver => {
      const { memberId: appMemberId, title } = approver
      let isVisible = true
      if (!!query && !title?.toLowerCase().includes(query)) {
        isVisible = false
      }

      // When render the one-time approvers dropdown list,
      // exclude the member to prevent the creator from being selected as the reviewer.
      // Also exclude the selected member from the list to avoid confusion.
      return isVisible && appMemberId !== memberId && appMemberId !== selectedApprover?.memberId
    },
    [memberId, query, selectedApprover],
  )

  const getApproverComponents = useCallback(() => {
    const toggleSelect = (memberId: number) => {
      if (selectedApprover?.memberId === memberId) {
        setSelectedApprover(null)
      } else {
        const oneTimeReviewer = approvers.find(approver => approver.memberId === memberId) ?? null
        setSelectedApprover(oneTimeReviewer)
      }
      setQuery('')

      // Close the dropdown and remove the search text after selection
      if (typeof comboboxRef.current?.closeDropdown === 'function') {
        comboboxRef.current.closeDropdown()
      }
    }

    const getApproverComp = (approver: Approver) => {
      return (
        <ApproverComp
          key={`approver-${approver.memberId}`}
          approver={approver}
          onClick={() => toggleSelect(approver.memberId)}
        />
      )
    }

    return approvers.filter(isVisibleItem).map(approver => getApproverComp(approver))
  }, [approvers, selectedApprover, isVisibleItem])

  const renderError = () => {
    return (
      <ValidationBanner
        fieldValidations={fieldValidations}
        field={FIELD_VALIDATIONS.ONE_TIME_REVIEWER}
        type={FIELD_TYPES.ONE_TIME_REVIEWER}
        isBulkComposer={false}
      />
    )
  }

  const shouldShowError = ValidationUtils.hasErrorsByField(
    fieldValidations,
    FIELD_VALIDATIONS.ONE_TIME_REVIEWER,
  )

  const setComboboxRef = useCallback(
    combobox => {
      // combobox is an instance of LocalizedLazyRenderCombobox
      if (combobox) {
        comboboxRef.current = combobox
      }
    },
    [comboboxRef],
  )

  return (
    <div>
      <Header>
        <TitleText>{$i18n.title()}</TitleText>
      </Header>
      {approvers.length > 0 ? (
        <>
          <Subtitle>{$i18n.subtitle()}</Subtitle>
          <LazyRenderCombobox
            ref={setComboboxRef}
            width={'100%'}
            maxPillsToDisplay={MAX_PILLS_TO_DISPLAY}
            placeholder={$i18n.placeholder()}
            noResultsFoundText={$i18n.noResultsFoundText()}
            activePills={getActivePills()}
            isDisabledState={isDisabledState}
            isErrorState={shouldShowError}
            onOpenDropdown={onOpenDropdown}
            onQuery={onQuery}
            onPillRemoval={onPillRemoval}
          >
            {getApproverComponents}
          </LazyRenderCombobox>
          {shouldShowError && renderError()}
        </>
      ) : (
        <Banner type={TYPE_INFO} messageText={$i18n.noApprovers()} />
      )}
    </div>
  )
}

ApproverArea.displayName = 'ApproverArea'

const LocalizedApproverArea = withI18n({
  title: 'Ask for approval',
  subtitle: 'Invite a team member with access to the selected accounts to approve this post first.',
  placeholder: 'Search for a team member to approve your post',
  noResultsFoundText: "We couldn't find that member. Try a different name.",
  invalidSelectedApproverTitle: "This team member doesn't have access to your accounts",
  invalidSelectedApproverText: 'Try searching for a different team member to approve your post.',
  noApprovers: "You don't have team members with permission to approve posts for the selected accounts.",
})(ApproverArea)

export default compose(
  connect(composerMessageStore, state => ({
    fieldValidations: getSelectedMessageValue(state, 'fieldValidations', false, {}),
    selectedMessageForEdit: getSelectedMessage(state),
  })),
  connect(socialProfileStore, (state: SocialProfileState) => ({
    privateSocialProfiles: state.private,
  })),
)(LocalizedApproverArea)
