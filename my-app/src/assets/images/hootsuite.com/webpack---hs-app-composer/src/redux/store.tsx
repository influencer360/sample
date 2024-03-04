import React from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'

import rootReducer from './reducers'

export const store = configureStore({
  reducer: rootReducer,
  devTools: {
    name: 'hs-app-composer',
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>

export const StoreProvider = ({ children }) => <Provider store={store}>{children}</Provider>
