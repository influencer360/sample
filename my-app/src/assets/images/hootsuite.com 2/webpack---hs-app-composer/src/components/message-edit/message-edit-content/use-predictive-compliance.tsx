import React, { useEffect, useState, useCallback } from 'react'
import isEqual from 'lodash/isEqual'

import { selectedMessageInterface as SelectedMessageState } from 'fe-pnc-data-composer-message'
import { store, checkContent, clear } from 'fe-pnc-data-predictive-compliance'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { useStoreValue, usePrevious } from 'fe-pnc-lib-hooks'

import PredictiveComplianceBanner from '@/components/predictive-compliance-banner'
import PredictiveComplianceIndicator from '@/components/predictive-compliance-indicator'
import PredictiveComplianceUtils from '@/utils/predictive-compliance-utils'

const DEFAULTS = {
  isEnabled: false,
  hasError: false,
  indicator: null,
  banner: null,
}

interface PredictiveComplianceArgs {
  text: string
  isFocused: boolean
  organizationId: number | null
  enablePredictiveCompliance: boolean
}

const usePredictiveCompliance = ({
  text,
  isFocused,
  organizationId,
  enablePredictiveCompliance = true,
}: PredictiveComplianceArgs) => {
  const { isEnabled, status, violations } = useStoreValue(
    store,
    state => ({
      isEnabled: state.isEnabled,
      status: state.status || null,
      violations: state.violations,
    }),
    isEqual,
  )

  const prevIsFocused = usePrevious(isFocused)
  const [canCheck, setCanCheck] = useState(isEnabled)

  const sendCheckContent = useCallback(() => {
    const urlPreview = SelectedMessageState.urlPreview()
    const complianceObj = PredictiveComplianceUtils.parseInputs({
      text,
      urlPreview,
      organizationId,
    })

    if (complianceObj && organizationId) {
      checkContent(complianceObj)
    }
  }, [organizationId, text])

  useEffect(() => {
    const hasStateChanged = prevIsFocused && !isFocused
    if (hasStateChanged && isEnabled && canCheck && text) {
      sendCheckContent()
      setCanCheck(false)
    }
  }, [prevIsFocused, isFocused, isEnabled, canCheck, text, sendCheckContent])

  useEffect(() => {
    if (isEnabled) {
      setCanCheck(true)
      clear()
    }
  }, [text, isEnabled])

  return isEnabled && enablePredictiveCompliance
    ? {
        isEnabled,
        hasError: !isFocused && PredictiveComplianceUtils.getState(status).isRejected,
        indicator: <PredictiveComplianceIndicator status={isFocused ? null : status} />,
        banner: !isFocused && <PredictiveComplianceBanner status={status} violations={violations} />,
      }
    : DEFAULTS
}

export default (args: PredictiveComplianceArgs) =>
  isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE') ? usePredictiveCompliance(args) : DEFAULTS
