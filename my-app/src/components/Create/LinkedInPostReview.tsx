'use client';
import styled from '@emotion/styled';
import { Avatar, Box } from '@mui/material';
import React from 'react';
import LinkedInIcon from '@/assets/icons/linkedIn-icon.svg'
import DotIcon from '@/assets/icons/dot-icon.svg';
import { IPostContentType, IUserInfoDropdown } from '@/utils/commonTypes';
import { hashtag, stringAvatar, stringToHTML } from '@/lib/utils';
import { useAppSelector } from '@/lib/hooks';
import LikeIcon from '@/assets/icons/like-icon.svg';
import CommentIcon from '@/assets/icons/comment-icon.svg';
import ShareIcon from '@/assets/icons/share-icon.svg';
import parse from 'html-react-parser';

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

const StyledContent = styled('div')({
    padding: "0px 12px 12px",
    fontWeight: 400,
    fontSize: "16px",
    lineHeight: "20px",
    color: "rgb(47, 54, 56)",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
    '& p':{
        fontSize: "16px",
        fontWeight: 400,
        lineHeight: "20px",
        color: "rgb(36, 31, 33)",
        marginTop: "0px"
    }
});
const StyledImagesContainer = styled('div')({
    flexWrap: "wrap",
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center"
});

const StyledImage = styled('img')({
    height: "280px",
    width: "auto",
    background: "none",
    display: "block"
});

const StyledContentFooter = styled(Box)({
    flex: "0 0 auto",
    display: "flex",
    justifyContent: "flex-start",
    height: "40px",
    lineHeight: "40px",
    paddingLeft: "8px"
})
const StyledFooterItem = styled(Box)({
    fontSize: "13px",
    fontWeight: "bold",
    color: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "0px 8px"
})
const StyledFooterMessage = styled(Box)({
    width: "400px",
    fontSize: "14px",
    textAlign: "center",
    lineHeight: "18px",
    color: "rgb(36, 31, 33)",
    margin:"auto",
    padding:"10px",
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial'
})
const StyledLink = styled('a')({
    fontSize: "14px",
    lineHeight: "18px",
    color: "rgb(47, 107, 154)",
    margin: "0",
    padding: "0"
});

const StyledSubTitle = styled('p')({ fontSize: "14px", color: "rgb(93, 99, 102)", margin: "0px" })

const LinkedInPostPreview = ({ selectedUser }: { selectedUser: IUserInfoDropdown }) => {

    const postContent = useAppSelector((state) => state.createPostContent.initialValues)
    const generateHtmlElement = hashtag(postContent.content);

    return <Box>
        <StyledPreviewWrapper>
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
                    {parse(generateHtmlElement)}
                </StyledContent>
                <StyledImagesContainer>
                    {!!postContent.imageFiles.length && <StyledImage src={postContent.imageFiles[0].imgFile} />}
                </StyledImagesContainer>
                <StyledContentFooter>
                    <StyledFooterItem>
                        <LikeIcon />
                        Like
                    </StyledFooterItem>
                    <StyledFooterItem>
                        <CommentIcon />
                        Comment
                    </StyledFooterItem>
                    <StyledFooterItem>
                        <ShareIcon />
                        Share
                    </StyledFooterItem>
                </StyledContentFooter>
            </StyledContentWrapper>
        </StyledPreviewWrapper>
        <StyledFooterMessage>
            Social networks regularly make updates to formatting, so your post may appear slightly different when published.
            <StyledLink href="#">Learn More</StyledLink>
        </StyledFooterMessage>
    </Box>
}

export default LinkedInPostPreview;