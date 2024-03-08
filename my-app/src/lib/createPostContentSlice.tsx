
import { ImgType } from '@/utils/commonTypes';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';



interface CreatePostContentProps {
  initialValues:{
    content:string;
    imageFiles:Array<ImgType>;
  }
}

const initialState: CreatePostContentProps = {
    initialValues:{
        content:'',
        imageFiles:[]
    }
};

const createPostContentSlice = createSlice({
  name: 'createPostContent',
  initialState,
  reducers: {
    addPostContent: (state,action:PayloadAction<string>) => {
      state.initialValues = {...state.initialValues,content:action.payload}
    },
    addImageFile: (state,action:PayloadAction<ImgType>) => {
        const payloadAction = [...state.initialValues.imageFiles,action.payload]
        console.log(payloadAction)
        state.initialValues.imageFiles = [...state.initialValues.imageFiles,action.payload];
    },
    addImageFiles: (state,action:PayloadAction<ImgType[]>) => {
        state.initialValues.imageFiles = action.payload;
    },
    removeImageFile:(state,action:PayloadAction<number>) => {
        console.log(action.payload,'action.payload')
        const filteredImages = state.initialValues.imageFiles.filter((item)=>item.id !== action.payload)
        state.initialValues.imageFiles = filteredImages;
    }
    
  },
});

export const createPostContentActions = createPostContentSlice.actions;
export const createPostContentReducer = createPostContentSlice.reducer;