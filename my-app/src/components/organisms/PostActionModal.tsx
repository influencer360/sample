'use client';
import { Alert, Box, Button, ClickAwayListener, Typography, styled } from '@mui/material';
import React from 'react';
import UiButton from '../UiComponents/Button/UiButton';
import UiDatePicker from '../UiComponents/DateTimePicker/UIDatePicker';
import { Moment } from 'moment';
import moment from 'moment-timezone';
import UiTimePicker from '../UiComponents/DateTimePicker/UiTimePicker';
import { useActions, useAppSelector } from '@/lib/hooks';
import SimpleButton from '../UiComponents/Button/SimpleButton';
import IconButton from '../UiComponents/Button/IconButton';
import CloseIcon from '@/assets/icons/close-icon.svg';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';


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



const PostActionModal = () => {

    const [toggleDisplay, setDisplay] = React.useState(false);
    const [dateTimeValue, setDateTimeValue] = React.useState<Moment>(moment.tz(moment(), "America/Los_Angeles").add(1, 'hours'));
    const [timeValidationError, setTimeError] = React.useState<boolean>(false);

    const scheduledTime = useAppSelector((state) => state.createPostContent.initialValues.schedule)
    const socialContentUsers = useAppSelector(state => state.createPostContent.initialValues.userContent);

    const { schedulePostAction } = useActions();

    const formatTime = (momentTime: string) => {
        return moment(momentTime).format('LLLL');
    }

    React.useEffect(() => {
        if (timeValidationError) {
            setTimeError(false)
        }

    }, [dateTimeValue]);

    const handleSubmit = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        schedulePostAction(dateTimeValue.format())
        setDisplay(false);
    }

    const handleToggle = (event:React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        event.stopPropagation();
        setDisplay((value) => !value)
    }


    return <ClickAwayListener onClickAway={() => setDisplay(false)}>
        <StyledWrapper>
                <SimpleButton sx={{ position: "relative" }} >
                    {scheduledTime.length?`Schedule ${socialContentUsers.length > 1 ? `(${socialContentUsers.length})` : ''}`:'Publish'}
                    <Box className='ml-2 border-l border-black px-2 relative' onClick={handleToggle}><KeyboardArrowDownIcon /></Box>
                </SimpleButton>
                {toggleDisplay &&<StyledContentArea>
                        <h2>Save Draft</h2>
                    </StyledContentArea>}
        </StyledWrapper>

    </ClickAwayListener>
};


export default PostActionModal;