'use client';
import { Box, styled } from '@mui/material';
import React from 'react';
import UiTextEditor from '../UiComponents/Editor/UITextEditor';
import UiFileUploader from '../UiComponents/FileUploader/UiFileUploader';
import UiIconButton from '../UiComponents/Button/IconButton';
import CloseIcon from '@/assets/icons/close-icon.svg';
import { IPostContentType, IUserContentType } from '@/utils/commonTypes';
import ImageGalleryModal from '../organisms/ImageGalleryModal';
import { useActions, useAppSelector } from '@/lib/hooks';

const StyledFileUploadWrapper = styled(Box)({
    display: 'flex',
    gap: '10px',
    position: "relative",
    padding: "24px"
});

const StyledUploadedFileWrapper = styled(Box)({
    width: "112px",
    height: "112px",
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
    cursor: 'pointer'
});

const StyledThumbnailWrapper = styled(Box)({
    height: "112px",
    width: "112px",
    overflow: "hidden",
    minWidth: "112px",
    cursor: 'pointer',
    borderRadius: '10px'
});

const StyledThumbnailPreview = styled(Box)<{ img: string }>(({ img }) => ({
    width: "112px",
    height: "112px",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundImage: `url(${img})`
}));

const StyledTabHeader = styled(Box)({
    minHeight: "45px",
    alignItems: "center",
    marginBottom: "3px"
});

const StyledTabItem = styled(Box)<{ activetab: number }>(({ activetab }) => ({
    minHeight: "45px",
    padding: "11px",
    display: "table-cell",
    minWidth: "44px",
    boxSizing: "border-box",
    lineHeight: 1,
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
    fontWeight: 700,
    fontSize: "16px",
    color: "rgb(252, 252, 251)",
    backgroundColor: activetab ? "rgb(20, 48, 89)" : 'rgb(208, 214, 222)',
    verticalAlign: "middle",
    textAlign: "center",
    wordBreak: "break-all",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 250ms ease 0s, color 250ms ease 0s",
    border: "2px solid transparent",
    borderRadius: '5px'
}))


type IProps = {
    setPostContent: React.Dispatch<React.SetStateAction<IPostContentType>>
    postContent: IPostContentType
}

const CreateSocialPost = ({ socialUser, activeTab }: { socialUser: IUserContentType; activeTab: number }) => {

    const { addSocialUserContentAction, removeSocialUserImageFile,addSocialUserAddImagesAction } = useActions();

    const editorTextHandler = (value: string) => {
        addSocialUserContentAction({ idx: activeTab, content: value })
    };


    const handleImageFile = (uploadedFiles: File[]) => {
        uploadedFiles.forEach((value) => {
            const reader = new FileReader();
            reader.readAsDataURL(value)
            reader.onload = () => {
                addSocialUserAddImagesAction({idx:activeTab,imageFile:{id:Date.now(),imgFile:reader.result as string}})
            };
            reader.onerror = (error) => {
                console.log('Error: ', error);
            };

        });
    }

    return <Box className='w-full'>
        <UiTextEditor setEditorText={editorTextHandler} editorContent={socialUser.content} />
        <StyledFileUploadWrapper>
            <UiFileUploader handleFile={(value: File[]) => handleImageFile(value)} />
            {!!socialUser.imageFiles.length && socialUser.imageFiles.map((item, key) => <StyledUploadedFileWrapper key={key}>
                <StyledThumbnailWrapper>
                    <StyledThumbnailPreview img={item.imgFile} />
                </StyledThumbnailWrapper>
                <StyledCloseButtonWrapper className='rounded-full' onClick={() => removeSocialUserImageFile({id:item.id,idx:activeTab})}>
                    <UiIconButton>
                        <CloseIcon />
                    </UiIconButton>
                </StyledCloseButtonWrapper>
            </StyledUploadedFileWrapper>)}
        </StyledFileUploadWrapper>
    </Box>
}


const CreatePostContent = () => {


    const uploadedImages = useAppSelector((state) => state.createPostContent.initialValues.imageFiles);
    const socialContentUsers = useAppSelector(state => state.createPostContent.initialValues.userContent);
    const activeTab = useAppSelector(state => state.createPostContent.initialValues.activeTab);
    const { addPostContent, addImageFile, removeImageFile, setActiveTabAction, addSocialUserContentAction } = useActions();
    const editorTextHandler = (value: string) => {
        addPostContent(value);
    };
    const handleTabChange = (newValue: number) => {
        setActiveTabAction(newValue);
    };


    const handleImageFile = (uploadedFiles: File[]) => {

        uploadedFiles.forEach((value) => {
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

    return <Box className="w-full">{socialContentUsers.length ? <>
        <StyledTabHeader className="flex gap-2">
            {socialContentUsers.map((item, key) => <StyledTabItem key={key} activetab={key === activeTab?1:0} onClick={() => handleTabChange(key)}>{item.socialAccount}</StyledTabItem>)}
        </StyledTabHeader>
        <CreateSocialPost key={activeTab} socialUser={socialContentUsers[activeTab]} activeTab={activeTab} />
    </> :
        <>
            <StyledTabHeader className="flex gap-2">
                <StyledTabItem activetab={1} >{'Initial Content'}</StyledTabItem>
            </StyledTabHeader>
            <UiTextEditor setEditorText={editorTextHandler} editorContent={''} />
            <StyledFileUploadWrapper>
                <UiFileUploader handleFile={(value: File[]) => handleImageFile(value)} />
                {!!uploadedImages.length && uploadedImages.map((item, key) => <StyledUploadedFileWrapper key={key}>
                    <StyledThumbnailWrapper>
                        <StyledThumbnailPreview img={item.imgFile} />
                    </StyledThumbnailWrapper>
                    <StyledCloseButtonWrapper className='rounded-full' onClick={() => removeImageFile(item.id)}>
                        <UiIconButton>
                            <CloseIcon />
                        </UiIconButton>
                    </StyledCloseButtonWrapper>
                </StyledUploadedFileWrapper>)}
            </StyledFileUploadWrapper>
        </>}
        <ImageGalleryModal activeTab={socialContentUsers.length?activeTab+1:activeTab} />
    </Box>
}

export default CreatePostContent;
