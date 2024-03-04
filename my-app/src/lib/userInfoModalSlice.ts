import { IDropdownOptions,IUserInfoDropdown } from '@/utils/commonTypes';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IUserInfoModalProps {
  isOpen: boolean;
  initialValues:Array<{id:string,name:string}>;
}

const initialState: IUserInfoModalProps = {
    isOpen: false,
    initialValues:[
        {id:'linkedIn',name: 'LinkedIn'},
        {id:'youtube',name:'Youtube'},
        {id:'facebook',name:'Facebook'}
    ]
};

const userInfoModalSlice = createSlice({
  name: 'userInfoModal',
  initialState,
  reducers: {
    closeUserInfoModal: (state) => {
      state.isOpen = false;
      state.initialValues = initialState.initialValues;
    },
    openUserInfoModal: () => ({
      ...initialState,
      isOpen: true,
    })
  },
});

export const userInfoModalActions = userInfoModalSlice.actions;
export const userInfoModalReducer = userInfoModalSlice.reducer;