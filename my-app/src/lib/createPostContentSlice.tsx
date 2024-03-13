
import { ImgType, IUserContentType, IUserInfoDropdown } from '@/utils/commonTypes';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';



interface CreatePostContentProps {
  initialValues: {
    activeTab: number;
    userContent: Array<IUserContentType>;
    content: string;
    imageFiles: Array<ImgType>;
    schedule:string;
  }
}

const initialState: CreatePostContentProps = {
  initialValues: {
    activeTab: 0,
    userContent: [],
    content: '',
    imageFiles: [],
    schedule:''
  }
};

const createPostContentSlice = createSlice({
  name: 'createPostContent',
  initialState,
  reducers: {
    addPostContent: (state, action: PayloadAction<string>) => {
      state.initialValues = { ...state.initialValues, content: action.payload }
    },
    addImageFile: (state, action: PayloadAction<ImgType>) => {
      state.initialValues.imageFiles = [...state.initialValues.imageFiles, action.payload];
    },
    addImageFiles: (state, action: PayloadAction<ImgType[]>) => {
      state.initialValues.imageFiles = action.payload;
    },
    removeImageFile: (state, action: PayloadAction<number>) => {
      const filteredImages = state.initialValues.imageFiles.filter((item) => item.id !== action.payload)
      state.initialValues.imageFiles = filteredImages;
    },
    setActiveTabAction: (state, action: PayloadAction<number>) => {
      state.initialValues.activeTab = action.payload
    },
    addUserContentAction: (state, action: PayloadAction<Array<IUserContentType>>) => {
      state.initialValues.userContent = action.payload
    },
    addSocialUserContentAction: (state, action: PayloadAction<{ idx: number; content: string }>) => {
      state.initialValues.userContent[action.payload.idx].content = action.payload.content;
    },
    addSocialUserAddImagesAction: (state, action: PayloadAction<{ idx: number; imageFile: ImgType }>) => {
      const currentImageFiles = state.initialValues.userContent[action.payload.idx].imageFiles;
      state.initialValues.userContent[action.payload.idx].imageFiles = [...currentImageFiles, action.payload.imageFile]
    },
    removeSocialUserImageFile: (state, action: PayloadAction<{idx:number; id:number}>) => {
      const filteredImages = state.initialValues.userContent[action.payload.idx].imageFiles.filter((item) => item.id !== action.payload.id)
      state.initialValues.userContent[action.payload.idx].imageFiles = filteredImages;
    },
    schedulePostAction:(state,action:PayloadAction<string>)=>{
      state.initialValues.schedule = action.payload;
    }
  }
});

export const createPostContentActions = createPostContentSlice.actions;
export const createPostContentReducer = createPostContentSlice.reducer;