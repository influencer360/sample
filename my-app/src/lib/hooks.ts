import { useDispatch, useSelector, useStore } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState } from './store'
import { bindActionCreators } from '@reduxjs/toolkit';
import { userInfoModalActions } from './userInfoModalSlice';
import { userInfoActions } from './userInfoSlice';

const actions = {
    ...userInfoModalActions,
    ...userInfoActions
};

// Use throughout your app instead of plain `useDispatch` and `useSelector`

export const useActions = () => {
    const dispatch = useDispatch();
    return bindActionCreators(actions, dispatch);
};
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;