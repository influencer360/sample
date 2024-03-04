import React from 'react'
import { InputToggle } from 'fe-comp-input-toggle'
import translation from 'fe-pnc-lib-hs-translation'

import { StyledTiktokEngagementArea } from './tiktok-engagement-area.style'

interface Props {
  updateFieldById: (messageId: number | null, fieldId: string, value: any) => void
  messageId: number | null
  disableStitch: boolean
  disableComment: boolean
  disableDuet: boolean
}

export const TiktokEngagementArea = ({
  disableStitch,
  disableComment,
  disableDuet,
  messageId,
  updateFieldById,
}: Props) => {
  return (
    <div>
      <StyledTiktokEngagementArea>
        <InputToggle
          label={translation._('Allow comments')}
          onChange={() => {
            updateFieldById(messageId, 'disableComment', !disableComment)
          }}
          checked={!disableComment}
          labelAdornment="start"
        />
        <InputToggle
          label={translation._('Allow Duet')}
          onChange={() => {
            updateFieldById(messageId, 'disableDuet', !disableDuet)
          }}
          checked={!disableDuet}
          labelAdornment="start"
        />
        <InputToggle
          label={translation._('Allow Stitch')}
          onChange={() => {
            updateFieldById(messageId, 'disableStitch', !disableStitch)
          }}
          checked={!disableStitch}
          labelAdornment="start"
        />
      </StyledTiktokEngagementArea>
    </div>
  )
}
