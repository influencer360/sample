'use client';

import { Box, styled } from '@mui/material';
import React from 'react';
import {IUserContentType, IUserInfoDropdown } from '@/utils/commonTypes';
import InstagramPostPreview from './InstagramPostPreview';
import FacebookPostPreview from './FacebookPostPreview';
import LinkedInPostPreview from './LinkedInPostReview';
import { useAppSelector } from '@/lib/hooks';
import DefaultPostPreview from './DefaultPostPreview';

const StyledContentWrapper = styled(Box)({
    minWidth: "350px",
    padding: "10px 8px 5px",
    width: "100%",
    height: "100%"
});

const StyledTabContentWrapper = styled(Box)({
    display: "flex",
    flexFlow: "column",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: "0px",
    overflowY: "auto",
    padding: "50px",
    height:'850px',
    overflow:'auto'
});

const ComponentMap = ({ id,selectedUser }: { id: string, selectedUser:Partial<IUserContentType >}) => {

    const mapObject = {
        default:<DefaultPostPreview selectedUser={selectedUser}/>,
        instagram: <InstagramPostPreview selectedUser={selectedUser}  />,
        facebook: <FacebookPostPreview selectedUser={selectedUser} />,
        linkedIn: <LinkedInPostPreview selectedUser={selectedUser} />
    }
    const objKey = id as keyof typeof mapObject;
    return mapObject[objKey]
}

const PostContent = () => {

    const socialContentUsers = useAppSelector(state => state.createPostContent.initialValues.userContent);
    const activeTab = useAppSelector(state => state.createPostContent.initialValues.activeTab);
    const defaultContent = useAppSelector(state => state.createPostContent.initialValues.content);
    const defaultPostFiles = useAppSelector(state => state.createPostContent.initialValues.imageFiles);


    return <StyledContentWrapper className='flex flex-col gap-2'>
        <StyledTabContentWrapper className='flex-grow'>
                        {!!socialContentUsers.length ?<ComponentMap id={socialContentUsers[activeTab].socialAccount} selectedUser={socialContentUsers[activeTab]} />:<ComponentMap id={'default'} selectedUser={{content:defaultContent,imageFiles:defaultPostFiles}} />}

        </StyledTabContentWrapper>

    </StyledContentWrapper>
}

export default PostContent;