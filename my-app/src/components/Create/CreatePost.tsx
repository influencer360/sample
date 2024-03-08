'use client';
import { Box, styled } from '@mui/material';
import React from 'react';
import UiTextEditor from '../UiComponents/Editor/UITextEditor';
import UiFileUploader from '../UiComponents/FileUploader/UiFileUploader';
import UiIconButton from '../UiComponents/Button/IconButton';
import CloseIcon from '@/assets/icons/close-icon.svg';
import { IPostContentType, ImgType } from '@/utils/commonTypes';
import ImageGalleryModal from '../organisms/ImageGalleryModal';
import { useActions, useAppSelector } from '@/lib/hooks';

const StyledFileUploadWrapper = styled(Box)({
    display:'flex',
    gap:'10px',
    position: "relative",
    padding: "24px"
});

const StyledUploadedFileWrapper = styled(Box)({
    width: "112px",
    height: "112px",
    pointerEvents: "none",
    position: "relative",
    opacity: 1,
    transition: "opacity 0.35s ease 0s"
});
const StyledCloseButtonWrapper = styled(Box)({
    position: "absolute",
    top: "-8px",
    right: "-8px",
    marginLeft: "8px",
    backgroundColor: "rgb(20, 48, 89)",
    cursor:'pointer'
});

const StyledThumbnailWrapper = styled(Box)({
    height: "112px",
    width: "112px",
    overflow: "hidden",
    minWidth: "112px",
    cursor:'pointer',
    borderRadius:'10px'
});

const StyledThumbnailPreview = styled(Box)<{ img: string }>(({ img }) => ({
    width: "112px",
    height: "112px",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundImage: `url(${img})`
}))


type IProps = {
    setPostContent:React.Dispatch<React.SetStateAction<IPostContentType>>
    postContent:IPostContentType
}


const CreatePostContent = () => {


    const  uploadedImages = useAppSelector((state)=>state.createPostContent.initialValues.imageFiles)
    const {addPostContent,addImageFile,removeImageFile} = useActions();
    const editorTextHandler = (value:string)=>{
        addPostContent(value);
    }

    const handleImageFile = (uploadedFiles:File[])=>{

            uploadedFiles.forEach((value)=>{                
                const reader = new FileReader();
                reader.readAsDataURL(value)
                reader.onload = () => {
                    addImageFile({id:Date.now(),imgFile:reader.result as string})
                };
                reader.onerror = (error) => {
                    console.log('Error: ', error);
                };

            });
    }

    return <Box className="w-full">
        <UiTextEditor setEditorText={editorTextHandler} />
        <StyledFileUploadWrapper>
            <UiFileUploader handleFile={(value:File[])=>handleImageFile(value)} />
            {!!uploadedImages.length && uploadedImages.map((item,key)=><StyledUploadedFileWrapper key={key}>
                <StyledThumbnailWrapper>
                    <StyledThumbnailPreview img={item.imgFile} />
                </StyledThumbnailWrapper>
                <StyledCloseButtonWrapper  className='rounded-full' onClick={() => removeImageFile(item.id)}>
                    <UiIconButton>
                        <CloseIcon />
                    </UiIconButton>
                </StyledCloseButtonWrapper>
            </StyledUploadedFileWrapper>)}
        </StyledFileUploadWrapper>
        <ImageGalleryModal/>
    </Box>
}

export default CreatePostContent;