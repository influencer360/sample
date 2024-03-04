'use client';

import { Box, Typography, styled } from "@mui/material";
import UiButton from "../UiComponents/Button/UiButton";
import SearchPublishDropdown from "../UiComponents/Dropdown/SearchPublishDropdown";
import SocialLoginModal from "../organisms/SocialLoginModal";
import { useActions, useAppSelector } from "@/lib/hooks";
import PostContent from "./PostContent";

const StyledContent = styled('div')({
    display: "flex",
    paddingLeft:'32px',
});
const StyledFooter = styled('div')({
    display: "flex",
    flex: "0 0 auto",
    alignItems: "center",
    flexFlow: "row",
    height: "76px",
    userSelect: "none",
    boxSizing: "border-box",
    padding: "16px",
    backgroundColor: "rgb(252, 252, 251)",
    boxShadow: "rgba(0, 0, 0, 0.08) 0px 3px 2px inset"
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



export default function CreatePost() {

    const listData = useAppSelector((state) => state.userInfoDropdown.userData);
    const isSocialLoginModalOpen = useAppSelector((state) => state.userInfoModal.isOpen);
    const selectedSocialUser = useAppSelector((state) => state.userInfoDropdown.socialUserSelected);

    return <Box className="flex flex-col flex-grow">
        <StyledHeader>New Post</StyledHeader>
        <StyledContent className="flex-grow">
            <Box sx={{flexBasis:'55%'}} className="flex flex-col">
                <SearchPublishDropdown 
                    listData={listData}
                    selectedUser={selectedSocialUser}
                />
                <PostContent selectedUsers={selectedSocialUser}/>

            </Box>
            <Box sx={{flexBasis:'45%'}}></Box>
        </StyledContent>
        {/* <StyledFooter>
            <UiButton label={'Save As Draft'} />
        </StyledFooter> */}
        {isSocialLoginModalOpen &&<SocialLoginModal/>}
    </Box>
}