'use client';

import { Box, styled } from '@mui/material';
import React from 'react';
import TabMenu from '../UiComponents/Tab/TabMenu';
import TabMenuItem from '../UiComponents/Tab/TabMenuItem';
import TabContent from '../UiComponents/Tab/TabContent';
import { IUserInfoDropdown } from '@/utils/commonTypes';
import YoutubePost from './YoutubePost';
import FacebookPost from './FacebookPost';
import LinkedInPost from './LinkedInPost';

const StyledHeaderWrapper = styled(Box)({
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
    color: "rgb(36, 31, 33)",
    display: "flex",
    flexFlow: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1px",
});

const StyledContentWrapper = styled(Box)({
    minWidth: "350px",
    padding: "20px 0px 0px",
    width: "100%",
    height: "100%"
});

const StyledTabContentWrapper = styled(Box)({
    boxShadow: "rgb(124, 121, 122) 0px 0px 0px 1px",
});

const ComponentMap = ({ id }: { id: string }) => {

    const mapObject = {
        youtube: <YoutubePost />,
        facebook: <FacebookPost />,
        linkedIn: <LinkedInPost />
    }
    const objKey = id as keyof typeof mapObject;
    return mapObject[objKey]
}

const PostContent = ({ selectedUsers }: { selectedUsers: IUserInfoDropdown[] }) => {

    const [tabValue, setTabValue] = React.useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return <StyledContentWrapper className='flex flex-col gap-2'>
        <StyledHeaderWrapper>
            {!!selectedUsers.length && <TabMenu
                value={tabValue}
                onChange={handleTabChange}
            >
                {selectedUsers.map((item, index) =>
                    <TabMenuItem
                        key={index}
                        index={index}
                        label={item.socialAccount}
                    />)}

            </TabMenu>}
        </StyledHeaderWrapper>
        <StyledTabContentWrapper className='flex-grow'>


            {selectedUsers.map((item, index) =>

                <TabContent
                    key={index}
                    index={index}
                    value={tabValue}
                >
                    <ComponentMap id={item.socialAccount} />
                </TabContent>

            )}

        </StyledTabContentWrapper>

    </StyledContentWrapper>
}

export default PostContent;