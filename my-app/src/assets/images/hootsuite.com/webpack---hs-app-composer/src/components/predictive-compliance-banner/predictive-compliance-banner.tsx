import React from 'react'

import styled from 'styled-components'
import { InputBanner, TYPE_ERROR, TYPE_WARNING } from 'fe-comp-input-banner'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue } from 'fe-lib-theme'
import { ProofPointValidationList } from 'fe-pnc-comp-proofpoint-validation-list'
import translation from 'fe-pnc-lib-hs-translation'

import { Status } from '@/typings/PredictiveCompliance'
import PredictiveComplianceUtils from '@/utils/predictive-compliance-utils'

const PREDICTIVE_COMPLIANCE_TITLE_PENDING = translation._('Your post will be reviewed prior to publishing')
const PREDICTIVE_COMPLIANCE_TITLE_WARNING = translation._('Your post will be reviewed prior to publishing')
const PREDICTIVE_COMPLIANCE_TITLE_REJECTED = translation._('Your post is not compliant')
// prettier-ignore
const PREDICTIVE_COMPLIANCE_TITLE_WARNING_APPROVED = translation._('Your post is approved but some terms may not be compliant')
const MORE = translation._('more')

export const PredictiveComplianceInputBannerWrapper = venk(
  styled.div`
    padding: 0 ${() => getThemeValue(t => t.spacing.spacing24)};
  `,
  'PredictiveComplianceInputBannerWrapper',
)
PredictiveComplianceInputBannerWrapper.displayName = 'PredictiveComplianceInputBannerWrapper'

const getBannerTitle = ({ isRejected, isPending, isWarning, violations }) => {
  if (isRejected) {
    return PREDICTIVE_COMPLIANCE_TITLE_REJECTED
  } else if (isPending) {
    return PREDICTIVE_COMPLIANCE_TITLE_PENDING
  } else if (isWarning) {
    return violations.length > 0
      ? PREDICTIVE_COMPLIANCE_TITLE_WARNING_APPROVED
      : PREDICTIVE_COMPLIANCE_TITLE_WARNING
  }

  return null
}

interface PredictiveComplianceBannerProps {
  status: Status
  violations: Array<unknown>
}

const PredictiveComplianceBanner = ({ status, violations }: PredictiveComplianceBannerProps) => {
  const { isInProgress, isWarning, isPending, isRejected } = PredictiveComplianceUtils.getState(status)

  return !isInProgress && (violations.length > 0 || isWarning) ? (
    <PredictiveComplianceInputBannerWrapper>
      <InputBanner
        titleText={getBannerTitle({ isRejected, isPending, isWarning, violations })}
        type={isPending || isWarning ? TYPE_WARNING : TYPE_ERROR}
        messageText={''}
      >
        <ProofPointValidationList validationErrors={violations} moreString={MORE} />
      </InputBanner>
    </PredictiveComplianceInputBannerWrapper>
  ) : null
}

PredictiveComplianceBanner.displayName = 'PredictiveComplianceBanner'

PredictiveComplianceBanner.defaultProps = {
  status: null,
  violations: [],
}

export default PredictiveComplianceBanner
