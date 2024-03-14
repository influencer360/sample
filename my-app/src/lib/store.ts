import { configureStore } from '@reduxjs/toolkit'
import { userInfoModalReducer } from './userInfoModalSlice'
import { userInfoReducer } from './userInfoSlice'
import { mediaGalleryModalReducer } from './mediaGalleryModalSlice'
import { createPostContentReducer } from './createPostContentSlice'
import { coreApi } from './api/coreApi'
import { makeServer } from './mockServer'

makeServer({ environment: "development" })

export const makeStore = () => {
  return configureStore({
    reducer: {
      [coreApi.reducerPath]: coreApi.reducer,
      userInfoModal:userInfoModalReducer,
      userInfoDropdown:userInfoReducer,
      mediaGalleryModal:mediaGalleryModalReducer,
      createPostContent:createPostContentReducer
    },
    middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([coreApi.middleware])
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

