import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface IMediaModalGalleryProps {
  isOpen: boolean;
}

const initialState: IMediaModalGalleryProps = {
    isOpen: false,
};

const mediaGalleryModalSlice = createSlice({
  name: 'mediaGalleryModal',
  initialState,
  reducers: {
    closeMediaGalleryModal: (state) => {
      state.isOpen = false;
    },
    openMediaGalleryModal: () => ({
      ...initialState,
      isOpen: true,
    })
  },
});

export const mediaGalleryModalActions = mediaGalleryModalSlice.actions;
export const mediaGalleryModalReducer = mediaGalleryModalSlice.reducer;