'use client';
import { Box, styled } from '@mui/material';
import React from 'react';
import UiTextEditor from '../UiComponents/Editor/UITextEditor';
import UiFileUploader from '../UiComponents/FileUploader/UiFileUploader';
import UiIconButton from '../UiComponents/Button/IconButton';
import CloseIcon from '@/assets/icons/close-icon.svg';

const StyledFileUploadWrapper = styled(Box)({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, 112px)",
    columnGap: "20px",
    gridAutoFlow: "column",
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
    backgroundColor: "rgb(20, 48, 89)"
});

const StyledThumbnailWrapper = styled(Box)({
    height: "112px",
    width: "112px",
    overflow: "hidden",
    minWidth: "112px",
    cursor:'pointer'
});

const StyledThumbnailPreview = styled(Box)<{ img: string }>(({ img }) => ({
    width: "112px",
    height: "112px",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundImage: `url(${img})`
}))



const CreatePostContent = () => {

    const [editorText, setEditorText] = React.useState('');
    const [uploadedImage, setUploadedImage] = React.useState('');

    const handleFileChange = (uploadedFile: string) => {
        setUploadedImage(uploadedFile)
    }
    return <Box className="w-full">
        <UiTextEditor setEditorText={setEditorText} />
        <StyledFileUploadWrapper>
            <UiFileUploader handleFile={handleFileChange} />
            {!!uploadedImage.length && <StyledUploadedFileWrapper>
                <StyledThumbnailWrapper>
                    <StyledThumbnailPreview img={uploadedImage} />
                </StyledThumbnailWrapper>
                <StyledCloseButtonWrapper  className='rounded-full' onClick={() => setUploadedImage('')}>
                    <UiIconButton>
                        <CloseIcon />
                    </UiIconButton>
                </StyledCloseButtonWrapper>
            </StyledUploadedFileWrapper>}
        </StyledFileUploadWrapper>
    </Box>
}

export default CreatePostContent;