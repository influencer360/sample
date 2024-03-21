import {IUserInfoDropdown } from '@/utils/commonTypes';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IUserInfoProps {
    favorites:Array<IUserInfoDropdown>;
    socialUserSelected:Array<IUserInfoDropdown>;
    selectedUserErrorMessage:boolean
}

const initialState: IUserInfoProps = {
    favorites:[],
    socialUserSelected:[],
    selectedUserErrorMessage:false
};

const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    favoriteUserAction:(state,action: PayloadAction<Array<IUserInfoDropdown>>)=>{
        state.favorites = action.payload;
    },
    socialUserSelectionAction:(state,action: PayloadAction<Array<IUserInfoDropdown>>)=>{
        state.socialUserSelected = action.payload;
    },
    setSelectedUserErrorMessage:(state,action:PayloadAction<boolean>)=>{
      state.selectedUserErrorMessage = action.payload;
    }
  },
});

export const userInfoActions = userInfoSlice.actions;
export const userInfoReducer = userInfoSlice.reducer;