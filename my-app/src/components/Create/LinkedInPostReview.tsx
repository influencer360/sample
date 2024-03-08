'use client';
import styled from '@emotion/styled';
import { Avatar, Box } from '@mui/material';
import React from 'react';
import LinkedInIcon from '@/assets/icons/linkedIn-icon.svg'
import DotIcon from '@/assets/icons/dot-icon.svg';
import { IPostContentType, IUserInfoDropdown } from '@/utils/commonTypes';
import { stringAvatar } from '@/lib/utils';
import { useAppSelector } from '@/lib/hooks';

const StyledPreviewWrapper = styled(Box)({
    flex: "0 0 auto",
    display: "flex",
    flexFlow: "column",
    justifyContent: "flex-start",
    width: "450px",
    padding: "0px 0px 32px",
    alignItems: "center"
});
const StyledPreviewHeaderWrapper = styled(Box)({
    flex: "0 0 auto",
    width: "100%",
    marginBottom: "16px",
    display: "flex",
    flexFlow: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: '5px'
});

const StyledTitleWrapper = styled('p')({
    fontSize: "20px",
    fontWeight: 700,
    color: "rgb(36, 31, 33)",
    textTransform: "capitalize",
    margin: "0px 0px 0px 8px"
});

const StyledContentWrapper = styled(Box)({
    flex: "1 1 auto",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    borderRadius: "8px",
    background: "rgb(255, 255, 255)"
});

const StyledContentHeader = styled(Box)({
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px 12px 12px"
})

const StyledTitle = styled('p')({
    fontSize: "16px",
    fontWeight: 700,
    color: "rgb(36, 31, 33)",
    margin: "0px"
});

const StyledContent = styled('div')({});
const StyledImagesContainer = styled('div')({});

const StyledSubTitle = styled('p')({ fontSize: "14px", color: "rgb(93, 99, 102)", margin: "0px" })

const LinkedInPostPreview = ({selectedUser}:{selectedUser: IUserInfoDropdown}) => {

    const  postContent = useAppSelector((state)=>state.createPostContent.initialValues)

    return <StyledPreviewWrapper>
        <StyledPreviewHeaderWrapper>
            <LinkedInIcon />
            <StyledTitleWrapper>LinkedIn</StyledTitleWrapper>
        </StyledPreviewHeaderWrapper>
        <StyledContentWrapper>
            <StyledContentHeader>
                <div className='flex'>
                    <div className='mr-3'>
                        <Avatar {...stringAvatar(selectedUser.userName)} />
                    </div>
                    <div className='mr-3'>
                        <StyledTitle>{selectedUser.userName}</StyledTitle>
                        <StyledSubTitle>Just Now</StyledSubTitle>
                    </div>
                </div>
                <DotIcon />
            </StyledContentHeader>
            <StyledContent>
            {postContent.content}
            </StyledContent>
            <StyledImagesContainer>

            </StyledImagesContainer>

        </StyledContentWrapper>
    </StyledPreviewWrapper>
}

export default LinkedInPostPreview;