import { connect } from 'fe-hoc-connect'
import {
  actions as ComposerMessageActions,
  getSelectedMessageValue,
  store,
} from 'fe-pnc-data-composer-message'

import PostTypeToggle from './post-type-toggle'

export const ConnectedPostTypeToggle = connect(store, state => ({
  messageId: getSelectedMessageValue(state, 'id'),
  updateFieldById: ComposerMessageActions.updateFieldById,
  postType: getSelectedMessageValue(state, 'postType'),
}))(PostTypeToggle)
