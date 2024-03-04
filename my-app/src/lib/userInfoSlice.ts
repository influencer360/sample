import { IDropdownOptions,IUserInfoDropdown } from '@/utils/commonTypes';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IUserInfoProps {
  userData:IDropdownOptions;
  socialUserSelected:Array<IUserInfoDropdown>;
}

const initialState: IUserInfoProps = {
    userData:{favorites:[],private:[]},
    socialUserSelected:[]
};

const userInfoSlice = createSlice({
  name: 'userInfo',
  initialState,
  reducers: {
    addSocialUser:(state,action: PayloadAction<IUserInfoDropdown>)=>({
        ...initialState,
        userData:{...state.userData,private:[...state.userData.private,action.payload]}
    }),
    favoriteUserAction:(state,action: PayloadAction<Array<IUserInfoDropdown>>)=>{
        state.userData = {...state.userData,favorites:action.payload}
    },
    socialUserSelectionAction:(state,action: PayloadAction<Array<IUserInfoDropdown>>)=>{
        state.socialUserSelected = action.payload;
    }
  },
});

export const userInfoActions = userInfoSlice.actions;
export const userInfoReducer = userInfoSlice.reducer;