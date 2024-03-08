import { configureStore } from '@reduxjs/toolkit'
import { userInfoModalReducer } from './userInfoModalSlice'
import { userInfoReducer } from './userInfoSlice'
import { mediaGalleryModalReducer } from './mediaGalleryModalSlice'
import { createPostContentReducer } from './createPostContentSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {
      userInfoModal:userInfoModalReducer,
      userInfoDropdown:userInfoReducer,
      mediaGalleryModal:mediaGalleryModalReducer,
      createPostContent:createPostContentReducer
    },
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

