import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import clone from 'lodash/clone'
import type { SCHEDULER_MODES } from 'fe-pnc-comp-form-scheduler'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import Constants from '@/constants/constants'
import type { UploadingFile } from '@/typings/Constants'

export const INITIAL_UPLOADING_FILES_STATE = []

interface ComposerType {
  acceptedHashtagSuggestion: boolean
  checkPredictiveComplianceAndSend: boolean
  defaultRecommendedTimesMode: SCHEDULER_MODES
  isAutoScheduled: boolean
  isDuplicatingPost: boolean
  isEligibleProductAccountSelected: boolean
  isFetchingPinterestBoards: boolean
  isSchedulerOpen: boolean
  isSendingMessage: boolean
  isSequentialPostingEnabled: boolean
  isSequentialPostingInProgress: boolean
  isUploading: boolean
  selectedNetworkGroup: string | null
  shouldShortenUrlsInBulk: boolean
  uploadingFiles: Array<UploadingFile>
}

export const initialState = {
  acceptedHashtagSuggestion: false,
  checkPredictiveComplianceAndSend: false,
  defaultRecommendedTimesMode: Constants.SCHEDULER_MODE.MANUAL,
  isAutoScheduled: false,
  isDuplicatingPost: false,
  isEligibleProductAccountSelected: false,
  isFetchingPinterestBoards: false,
  isSchedulerOpen: false,
  isSendingMessage: false,
  isSequentialPostingEnabled: false,
  isSequentialPostingInProgress: false,
  isUploading: false,
  selectedNetworkGroup: null,
  shouldShortenUrlsInBulk: false,
  uploadingFiles: INITIAL_UPLOADING_FILES_STATE,
} as ComposerType

const composerSlice = createSlice({
  name: 'composer',
  initialState,
  reducers: {
    setAcceptedHashtagSuggestion(state, action: PayloadAction<boolean>) {
      state.acceptedHashtagSuggestion = action.payload
    },
    setCheckPredictiveComplianceAndSend(state, action: PayloadAction<boolean>) {
      state.checkPredictiveComplianceAndSend = action.payload
    },
    setDefaultRecommendedTimesMode(state, action: PayloadAction<SCHEDULER_MODES>) {
      state.defaultRecommendedTimesMode = action.payload
    },
    setIsAutoScheduled(state, action: PayloadAction<boolean>) {
      state.isAutoScheduled = action.payload
    },
    setIsDuplicatingPost(state, action: PayloadAction<boolean>) {
      state.isDuplicatingPost = action.payload
    },
    setIsEligibleProductAccountSelected(state, action: PayloadAction<boolean>) {
      state.isEligibleProductAccountSelected = action.payload
    },
    setIsFetchingPinterestBoards(state, action: PayloadAction<boolean>) {
      state.isFetchingPinterestBoards = action.payload
    },
    setIsSchedulerOpen(state, action: PayloadAction<boolean>) {
      state.isSchedulerOpen = action.payload
    },
    setIsSendingMessage(state, action: PayloadAction<boolean>) {
      state.isSendingMessage = action.payload
    },
    setIsUploading(state, action: PayloadAction<boolean>) {
      state.isUploading = action.payload
    },
    setIsSequentialPostingInProgress(state, action: PayloadAction<boolean>) {
      state.isSequentialPostingInProgress = action.payload
    },
    setIsSequentialPostingEnabled(state, action: PayloadAction<boolean>) {
      state.isSequentialPostingEnabled = action.payload
    },
    setSelectedNetworkGroup(state, action: PayloadAction<SocialNetworkGroup>) {
      state.selectedNetworkGroup = action.payload
    },
    resetSelectedNetworkGroup(state) {
      state.selectedNetworkGroup = initialState.selectedNetworkGroup
    },
    setShouldShortenUrlsInBulk(state, action: PayloadAction<boolean>) {
      state.shouldShortenUrlsInBulk = action.payload
    },
    setUploadingFiles(state, action: PayloadAction<Array<UploadingFile>>) {
      state.uploadingFiles = action.payload
    },
    updateProgressUploadingFile(state, action: PayloadAction<{ id: string; progress: number }>) {
      const newUploadingFiles = clone(state.uploadingFiles)
      const uploadingFile = newUploadingFiles.find(file => file?.id === action.payload.id)
      if (uploadingFile) {
        if (!uploadingFile.upload) {
          uploadingFile.upload = { progress: 0 }
        }
        uploadingFile.upload.progress = action.payload.progress
        state.uploadingFiles = newUploadingFiles
      }
    },
  },
})

export const composerActions = composerSlice.actions
export default composerSlice.reducer
