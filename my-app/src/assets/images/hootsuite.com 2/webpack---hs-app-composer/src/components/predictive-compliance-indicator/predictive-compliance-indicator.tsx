import React from 'react'

import styled from 'styled-components'
import Shield from '@fp-icons/emblem-shield'
import Icon from '@fp-icons/icon-base'
import { BouncingBars } from 'fe-comp-loader'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

import { Status } from '@/typings/PredictiveCompliance'
import PredictiveComplianceUtils from '@/utils/predictive-compliance-utils'

export const PredictiveComplianceInProgressWrapper = venk(
  withHsTheme(
    styled.span`
      margin-left: ${() => getThemeValue(t => t.spacing.spacing28)};
      font-weight: ${() => getThemeValue(t => t.typography.body.weight)};
      font-size: ${() => getThemeValue(t => t.typography.body.size)};
    `,
  ),
  'PredictiveComplianceInProgressWrapper',
)
PredictiveComplianceInProgressWrapper.displayName = 'PredictiveComplianceInProgressWrapper'

const PredictiveComplianceInProgressSpinnerWrapper = venk(
  styled.span`
    position: relative;
    left: -10px;
  `,
  'PredictiveComplianceInProgressSpinnerWrapper',
)
PredictiveComplianceInProgressSpinnerWrapper.displayName = 'PredictiveComplianceInProgressSpinnerWrapper'

export const PredictiveComplianceInProgressSpinner = () => (
  <PredictiveComplianceInProgressSpinnerWrapper>
    <BouncingBars size={16} />
  </PredictiveComplianceInProgressSpinnerWrapper>
)
PredictiveComplianceInProgressSpinner.displayName = 'PredictiveComplianceInProgressSpinner'

const PredictiveComplianceWrapper = venk(
  withHsTheme(
    styled.span`
      display: flex;
      margin-left: ${() => getThemeValue(t => t.spacing.spacing8)};
    `,
  ),
  'PredictiveCompliance',
)
PredictiveComplianceWrapper.displayName = 'PredictiveComplianceWrapper'

const PredictiveComplianceShield = withHsTheme(({ status, isFocused }) => {
  const WARNING_COLOR = getThemeValue(t => t.colors.accent)
  const SUCCESS_COLOR = getThemeValue(t => t.colors.complementaryGreen)
  const ENABLED_COLOR = getThemeValue(t => t.colors.darkGrey40)
  const ERROR_COLOR = getThemeValue(t => t.colors.complementaryRed)

  const { isWarning, isPending, isApproved, isRejected } = PredictiveComplianceUtils.getState(status)

  let fill = ENABLED_COLOR
  if (!isFocused) {
    if (isPending || isWarning) {
      fill = WARNING_COLOR
    } else if (isApproved) {
      fill = SUCCESS_COLOR
    } else if (isRejected) {
      fill = ERROR_COLOR
    }
  }

  return (
    <PredictiveComplianceWrapper>
      <Icon glyph={Shield} fill={fill} />
    </PredictiveComplianceWrapper>
  )
})
PredictiveComplianceShield.displayName = 'PredictiveComplianceShield'

interface PredictiveComplianceIndicatorProps {
  status: Status
}

const PredictiveComplianceIndicator = ({ status }: PredictiveComplianceIndicatorProps) => {
  const { isInProgress } = PredictiveComplianceUtils.getState(status)

  return isInProgress ? (
    <PredictiveComplianceInProgressWrapper>
      <PredictiveComplianceInProgressSpinner />
    </PredictiveComplianceInProgressWrapper>
  ) : (
    <PredictiveComplianceShield status={status} />
  )
}

PredictiveComplianceIndicator.displayName = 'PredictiveComplianceIndicator'

PredictiveComplianceIndicator.defaultProps = {
  status: null,
}

export default PredictiveComplianceIndicator
