'use client';

import { Box, styled } from '@mui/material';
import React from 'react';
import TabMenu from '../UiComponents/Tab/TabMenu';
import TabMenuItem from '../UiComponents/Tab/TabMenuItem';
import TabContent from '../UiComponents/Tab/TabContent';
import { IUserInfoDropdown } from '@/utils/commonTypes';
import InstagramPostPreview from './InstagramPostPreview';
import FacebookPostPreview from './FacebookPostPreview';
import LinkedInPostPreview from './LinkedInPostReview';

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
});

const StyledTabContent = styled(Box)({
    flex: "0 0 auto",
    display: "flex",
    flexFlow: "column",
    justifyContent: "flex-start",
    width: "450px",
    padding: "0px 0px 15px",
    alignItems: "center"
})

const ComponentMap = ({ id }: { id: string }) => {

    const mapObject = {
        instagram: <InstagramPostPreview />,
        facebook: <FacebookPostPreview />,
        linkedIn: <LinkedInPostPreview />
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
                <StyledTabContent key={index}>

                    <TabContent

                        index={index}
                        value={tabValue}
                    >
                        <ComponentMap id={item.socialAccount} />
                    </TabContent>

                </StyledTabContent>

            )}

        </StyledTabContentWrapper>

    </StyledContentWrapper>
}

export default PostContent;