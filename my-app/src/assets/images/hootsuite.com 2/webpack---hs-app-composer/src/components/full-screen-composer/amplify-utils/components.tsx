import React, { Suspense } from 'react'

import { TYPE_SUCCESS, TYPE_ERROR } from 'fe-comp-banner'
import { getState as getPredictiveComplianceState } from 'fe-pnc-data-predictive-compliance'
import { buildShowDialog } from 'fe-pnc-lib-modal-dialog-controller'

import { TOAST_TIMEOUT } from '@/components/full-screen-composer/full-screen-composer'
import ComposerUtils from '@/utils/composer-utils'
import StatusToastUtils from '@/utils/status-toast-utils'

const AmplifyComposerPublisher = React.lazy(
  () =>
    import(
      /* webpackChunkName: "amplify-composer-publisher" */
      'fe-amp-comp-composer-publisher'
    ),
)

const ContentWarningDialog = React.lazy(
  () =>
    import(
      /* webpackChunkName: "amplify-composer-publisher" */
      'fe-amp-comp-composer-publisher/dist/ContentWarningDialog'
    ),
)

const showAmplifyContentWarningDialog = async (): Promise<{
  confirmed: boolean
  doNotShowAgain: boolean
}> => {
  return new Promise(resolve => {
    const showDialog = buildShowDialog();

    showDialog(({ close }) => (
      <Suspense fallback={null}>
        <ContentWarningDialog
          onCancel={() => {
            close(() => {
              resolve({
                confirmed: false,
                doNotShowAgain: false,
              })
              return true
            })
          }}
          onConfirm={doNotShowAgain => {
            resolve({
              confirmed: true,
              doNotShowAgain,
            })
            close()
          }}
        />
      </Suspense>
    ))
  })
}

const showAmplifyPublisherDialog = async (
  messageData,
  scheduledDate,
  timezoneName,
  organizationId,
  customContext,
  amplifyMessage,
): Promise<void> => {
  const isProofpointComplianceEnabled = getPredictiveComplianceState().isEnabled

  const showDialog = buildShowDialog();

  return new Promise((resolve, reject) =>
    showDialog(({ close }) => {
      const onEvent = ({ status, msg, title, isDuplicate, error }) => {
        StatusToastUtils.createToast(title, msg, status, TOAST_TIMEOUT, null)
        if (status === TYPE_SUCCESS && !isDuplicate) {
          resolve()
        }
        if (status === TYPE_ERROR && error.name !== 'ValidationError') {
          reject(error)
        }
      }

      return (
        <Suspense fallback={null}>
          <AmplifyComposerPublisher
            composerMessage={messageData}
            amplifyMessage={amplifyMessage}
            onEvent={onEvent}
            close={close}
            isProofpointComplianceEnabled={isProofpointComplianceEnabled}
            scheduledDateTimeFromComposer={scheduledDate}
            timezone={timezoneName}
            organizationId={organizationId}
            context={ComposerUtils.isAmplifyEditPostComposer(customContext) ? 'EDIT_POST' : undefined}
          />
        </Suspense>
      )
    }),
  )
}

export { showAmplifyContentWarningDialog, showAmplifyPublisherDialog }
