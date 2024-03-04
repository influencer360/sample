import { combineReducers } from '@reduxjs/toolkit'

import composer from './composer'
import linkSettings from './linkSettings'
import validation from './validation'

const appReducer = combineReducers({
  composer,
  validation,
  linkSettings,
})

export default appReducer
