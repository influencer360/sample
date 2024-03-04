import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface ValidationType {
  errorCodesSeen: Array<number>
  ignoredPreviewValidationMessageCodes: Array<string>
  showOnSubmitErrors: boolean
}

export const initialState = {
  errorCodesSeen: [],
  ignoredPreviewValidationMessageCodes: [],
  showOnSubmitErrors: false,
} as ValidationType

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    resetErrorCodesSeen(state) {
      state.errorCodesSeen = initialState.errorCodesSeen
    },
    setIgnoredPreviewValidationMessageCodes(state, action: PayloadAction<Array<string>>) {
      state.ignoredPreviewValidationMessageCodes = action.payload
    },
    setErrorCodes(state, action: PayloadAction<Array<number>>) {
      if (Array.isArray(action.payload)) {
        state.errorCodesSeen = action.payload
      }
    },
    setShowOnSubmitErrors(state, action: PayloadAction<boolean>) {
      state.showOnSubmitErrors = action.payload
    },
  },
})

export const validationActions = validationSlice.actions
export default validationSlice.reducer
