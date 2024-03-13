import { createSlice } from '@reduxjs/toolkit';

interface IUserInfoModalProps {
  isOpen: boolean;
  initialValues:Array<{id:string,name:string}>;
}

const initialState: IUserInfoModalProps = {
    isOpen: false,
    initialValues:[
        {id:'linkedIn',name: 'LinkedIn'},
        {id:'instagram',name:'Instagram'},
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