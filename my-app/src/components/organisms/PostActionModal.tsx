'use client';
import { Box ,ClickAwayListener, styled } from '@mui/material';
import React from 'react';
import SimpleButton from '../UiComponents/Button/SimpleButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useActions, useAppSelector } from '@/lib/hooks';


const StyledWrapper = styled(Box)({ position: "relative", display: "inline-block" });
const StyledContentArea = styled(Box)({
    display: "block",
    position: "absolute",
    zIndex: 3308,
    bottom: "100%",
    marginBottom: "8px",
    right: "0px",
    width: "max-content",
    minWidth: "112px",
    animationDuration: "0.15s",
    animationName: "fXVEcN",
    animationIterationCount: "1",
    animationDelay: "0ms",
    color: "rgb(36, 31, 33)",
    background: "rgb(252, 252, 251)",
    boxShadow: "rgb(84, 61, 128) 0px 0px 0px 2px",
    boxSizing: "border-box",
    margin: "2px",
    padding: "12px 0px"
});

const StyledListItem = styled(Box)({
    backgroundColor: "rgb(252, 252, 251)",
    color: "rgb(36, 31, 33)",
    margin: "0px",
    height: "40px",
    lineHeight: "40px",
    padding: "0px 28px",
    fontSize: "16px",
    fontWeight: 400,
    userSelect: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
    '&:hover':{ backgroundColor: "rgb(254, 238, 209)" }
});



const PostActionModal = () => {

    const [toggleDisplay, setDisplay] = React.useState(false);

    const scheduledTime = useAppSelector((state) => state.createPostContent.initialValues.schedule)
    const socialContentUsers = useAppSelector(state => state.createPostContent.initialValues.userContent);
    const selectedUsers = useAppSelector(state => state.userInfoDropdown.socialUserSelected);

    const {setSelectedUserErrorMessage} = useActions();

    

    const handleToggle = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        event.stopPropagation();
        setDisplay((value) => !value)
    }

    const handleSubmitAction = () => {
        console.log('handleSubmitAction')
        if(!selectedUsers.length){
            setSelectedUserErrorMessage(true);
        }
    }

    const handleDraftAction = () => {
        console.log('handleDraftAction')
        if(!selectedUsers.length){
            setSelectedUserErrorMessage(true);
        }

    }

    const handleDuplicateAction =()=>{

        console.log('handleDuplicateAction')
        if(!selectedUsers.length){
            setSelectedUserErrorMessage(true);
        }

    }


    return <ClickAwayListener onClickAway={() => setDisplay(false)}>
        <StyledWrapper>
            <SimpleButton sx={{ position: "relative" }} onClick={() => handleSubmitAction()} >
                {scheduledTime.length ? `Schedule ${socialContentUsers.length > 1 ? `(${socialContentUsers.length})` : ''}` : 'Publish'}
                <Box className='ml-2 border-l border-black px-2 relative' onClick={handleToggle}><KeyboardArrowDownIcon /></Box>
            </SimpleButton>
            {toggleDisplay && <StyledContentArea>
                <StyledListItem onClick={() => handleDraftAction()}>Save Draft</StyledListItem>
                <StyledListItem onClick={() => handleDuplicateAction()}>{scheduledTime.length ? `Schedule ${socialContentUsers.length > 1 ? `(${socialContentUsers.length})` : ''} and duplicate` : 'Publish and duplicate'}</StyledListItem>
            </StyledContentArea>}
        </StyledWrapper>

    </ClickAwayListener>
};


export default PostActionModal;