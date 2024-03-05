import { configureStore } from '@reduxjs/toolkit'
import { userInfoModalReducer } from './userInfoModalSlice'
import { userInfoReducer } from './userInfoSlice'

export const makeStore = () => {
  return configureStore({
    reducer: {userInfoModal:userInfoModalReducer,userInfoDropdown:userInfoReducer},
  })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

