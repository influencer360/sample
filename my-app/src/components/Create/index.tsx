'use client';

import { Box, styled } from "@mui/material";
import SearchPublishDropdown from "../UiComponents/Dropdown/SearchPublishDropdown";
import SocialLoginModal from "../organisms/SocialLoginModal";
import {useAppSelector } from "@/lib/hooks";
import PostContent from "./PostContent";
import CreatePostContent from "./CreatePost";
import React from "react";

const StyledContent = styled('div')({
    display: "flex",
    paddingLeft:'32px',
});

const StyledHeader = styled('div')({
    display: "flex",
    flex: "0 0 auto",
    alignItems: "center",
    flexFlow: "row",
    height: "64px",
    userSelect: "none",
    boxSizing: "border-box",
    paddingLeft: "32px",
    paddingRight: "12px",
    color: "rgb(36, 31, 33)",
    backgroundColor: "rgb(252, 252, 251)",
    fontSize: "28px",
    fontWeight: 900,
    boxShadow: "rgba(0, 0, 0, 0.08) 0px -3px 2px inset"
});

const StyledPostPreviewWrapper = styled(Box)({
    display: "flex",
    flexFlow: "column",
    flexGrow: 1,
    width: "50%",
    minHeight: "0px",
    overflowY: "auto",
    maxWidth: "650px",
    flexBasis:'45%'
  })

export default function CreatePost() {

    const listData = useAppSelector((state) => state.userInfoDropdown.userData);
    const isSocialLoginModalOpen = useAppSelector((state) => state.userInfoModal.isOpen);
    const selectedSocialUser = useAppSelector((state) => state.userInfoDropdown.socialUserSelected);

    const [postContent,setPostContent] = React.useState({
        content:'',uploadedFile:''
    })

    return <Box className="flex flex-col flex-grow">
        <StyledHeader>New Post</StyledHeader>
        <StyledContent className="flex-grow">
            <Box sx={{flexBasis:'55%'}} className="flex flex-col">
                <SearchPublishDropdown 
                    listData={listData}
                    selectedUser={selectedSocialUser}
                />
                <CreatePostContent/>
            </Box>
            <StyledPostPreviewWrapper>
                <PostContent selectedUsers={selectedSocialUser} postContent={postContent} />
            </StyledPostPreviewWrapper>
        </StyledContent>
        {/* <StyledFooter>
            <UiButton label={'Save As Draft'} />
        </StyledFooter> */}
        {isSocialLoginModalOpen &&<SocialLoginModal/>}
    </Box>
}