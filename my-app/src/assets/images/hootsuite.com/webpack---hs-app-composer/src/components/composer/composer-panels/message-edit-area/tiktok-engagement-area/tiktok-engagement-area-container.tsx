import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import {
  actions as ComposerMessageActions,
  getSelectedMessageValue,
  store,
} from 'fe-pnc-data-composer-message'

import { TiktokEngagementArea } from './tiktok-engagement-area'

export const TiktokEngagementAreaContainer = compose(
  connect(store, state => ({
    disableStitch: getSelectedMessageValue(state, 'disableStitch'),
    disableComment: getSelectedMessageValue(state, 'disableComment'),
    disableDuet: getSelectedMessageValue(state, 'disableDuet'),
    messageId: getSelectedMessageValue(state, 'id'),
    updateFieldById: ComposerMessageActions.updateFieldById,
  })),
)(TiktokEngagementArea)
