'use client';
import styled from '@emotion/styled';
import { Avatar, Box, ImageList } from '@mui/material';
import React from 'react';
import InstagramRedIcon from '@/assets/icons/instagram-red-icon.svg'
import { IUserContentType } from '@/utils/commonTypes';
import { hashtag } from '@/lib/utils';
import parse from 'html-react-parser';
import Carousel from 'react-material-ui-carousel'

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
    color: "rgb(36, 31, 33)",
    fontWeight: 700,
    fontSize: "16px",
    marginRight: "5px"
});

const StyledContent = styled('div')({
    padding: "0px 12px 12px",
    fontWeight: 400,
    fontSize: "16px",
    lineHeight: "20px",
    color: "rgb(47, 54, 56)",
    overflowWrap: "break-word",
    whiteSpace: "pre-wrap",
    '& p': {
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
    height: "450px",
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
const StyledFooterItem = styled(Box)<{ imageUrl: string }>(({ imageUrl }) => ({
    backgroundImage:
        `url(${imageUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "24px",
    backgroundPosition: "center center",
    height: "40px",
    width: "40px"
}));
const StyledFooterMessage = styled(Box)({
    width: "400px",
    fontSize: "14px",
    textAlign: "center",
    lineHeight: "18px",
    color: "rgb(36, 31, 33)",
    margin: "auto",
    padding: "10px",
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial'
})
const StyledLink = styled('a')({
    fontSize: "14px",
    lineHeight: "18px",
    color: "rgb(47, 107, 154)",
    margin: "0",
    padding: "0"
});

const StyledThreeDot = styled('div')({
    backgroundImage:
        "url(https://i.hootsuite.com/assets/plancreate/ig-menu.svg)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100%",
    backgroundPosition: "center center",
    height: "24px",
    width: "24px"
})
const StyledInstagramName = styled('span')({
    color: "rgb(36, 31, 33)",
    fontWeight: 700,
    fontSize: "16px",
    marginRight: "5px"
})

const JustNowText = styled('p')({
    fontSize: "14px",
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "rgb(36, 31, 33)",
    margin: "0px"
})

const InstagramPostPreview = ({ selectedUser }: { selectedUser: Partial<IUserContentType> }) => {

    const generateHtmlElement = hashtag(selectedUser?.content || '');

    return <Box>
        <StyledPreviewWrapper>
            <StyledPreviewHeaderWrapper>
                <InstagramRedIcon />
                <StyledTitleWrapper>Instagram Post</StyledTitleWrapper>
            </StyledPreviewHeaderWrapper>
            <StyledContentWrapper>
                <StyledContentHeader>
                    <div className='flex'>
                        <div className='mr-3'>
                            <Avatar src={'https://i.hootsuite.com/assets/channel-integrations/default_avatar_ig_personal.svg'} />
                        </div>
                        <div className='mr-3 pt-2'>
                            <StyledTitle>{selectedUser.userName}</StyledTitle>
                        </div>
                    </div>
                    <StyledThreeDot className='mt-3' />
                </StyledContentHeader>
                {!!selectedUser?.imageFiles?.length && <Carousel autoPlay={false}>
                    {selectedUser.imageFiles.map((item, key) => (
                        <StyledImage src={item.imgFile} />
                    ))}
                </Carousel>}
                <Box className="flex justify-between">
                    <StyledContentFooter>
                        <StyledFooterItem imageUrl='https://i.hootsuite.com/assets/plancreate/ig-like-heart.svg' />
                        <StyledFooterItem imageUrl='https://i.hootsuite.com/assets/plancreate/ig-comment.svg' />
                        <StyledFooterItem imageUrl='https://i.hootsuite.com/assets/plancreate/ig-share.svg' />
                    </StyledContentFooter>
                    <StyledFooterItem imageUrl='https://i.hootsuite.com/assets/plancreate/ig-bookmark.svg' />
                </Box>
                <Box className="pl-4 pr-4 pb-1">
                    <StyledInstagramName>{selectedUser.userName}</StyledInstagramName>
                </Box>
                <Box className="pl-2 pr-2 pb-1">
                <StyledContent>
                    {parse(generateHtmlElement)}
                </StyledContent>
                </Box>
                <Box className="pl-4 pr-4 pb-4">
                    <JustNowText>Just now</JustNowText>
                </Box>
            </StyledContentWrapper>
        </StyledPreviewWrapper>
        <StyledFooterMessage>
            Social networks regularly make updates to formatting, so your post may appear slightly different when published.
            <StyledLink href="#">Learn More</StyledLink>
        </StyledFooterMessage>
    </Box>
}

export default InstagramPostPreview;