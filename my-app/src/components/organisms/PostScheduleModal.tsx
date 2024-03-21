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
import CloseIcon from '@/assets/icons/close-icon.svg'


const StyledWrapper = styled(Box)({ position: "relative", display: "inline-block" });
const StyledContentWrapper = styled(Box)(() => ({
    display: 'block',
    position: "absolute",
    background: "transparent",
    boxSizing: "border-box",
    zIndex: 1200,
    bottom: "100%",
    marginBottom: "8px",
    right: "0px",
    width: "max-content",
    animationDuration: "0.15s",
    animationName: "fXVEcN",
    animationIterationCount: "1",
    animationDelay: "0ms"
}));

const StyledContent = styled(Box)({
    position: "relative",
    color: "rgb(36, 31, 33)",
    background: "rgb(252, 252, 251)",
    boxShadow: "rgb(84, 61, 128) 0px 0px 0px 2px",
    boxSizing: "border-box",
    margin: "2px",
    width: "304px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    minHeight: "460px"
});

const StyledTimeLabel = styled('p')({
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: "20px",
    color: "rgb(36, 31, 33)"
});

const StyledTimezoneLabel = styled('p')({
    fontSize: "14px",
    color: "rgb(80, 76, 77)"
})

const StyledContentArea = styled(Box)({ flex: "1 1 0%" });

const StyledContentHeading = styled(Box)({ fontSize: "20px", fontWeight: 700, marginBottom: "24px" });



const PostScheduleModal = () => {

    const [toggleDisplay, setDisplay] = React.useState(false);
    const [dateTimeValue, setDateTimeValue] = React.useState<Moment>(moment.tz(moment(), "America/Los_Angeles").add(1, 'hours'));
    const [timeValidationError, setTimeError] = React.useState<boolean>(false);

    const scheduledTime = useAppSelector((state)=>state.createPostContent.initialValues.schedule)

    const {schedulePostAction} = useActions();

    const formatTime = (momentTime:string)=>{
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
    const handleClear =(event:React.MouseEvent<HTMLDivElement, MouseEvent>)=>{
        event.stopPropagation();
        schedulePostAction('')

    }


    return <ClickAwayListener onClickAway={()=>setDisplay(false)}>
        <StyledWrapper>
        {scheduledTime.length?
        <SimpleButton sx={{ position: "relative" }}  onClick={() => setDisplay((value) => !value)} >
            {formatTime(scheduledTime)}
            <Box className='ml-2 border border-black rounded-full p-2' onClick={handleClear}><CloseIcon/></Box>
        </SimpleButton>
        :<UiButton sx={{ position: "relative" }} label={"Schedule"} onClick={() => setDisplay((value) => !value)} />}
        {toggleDisplay && <StyledContentWrapper>
            <StyledContent>
                <StyledContentHeading>Schedule post</StyledContentHeading>
                <StyledContentArea>
                    <UiDatePicker dateTimeValue={dateTimeValue} setDateTimeValue={setDateTimeValue} />
                    <Box className="mt-4 mb-4">
                        <StyledTimeLabel>Manually set time</StyledTimeLabel>
                        <StyledTimezoneLabel>{`(GMT${dateTimeValue.format('Z')}) ${dateTimeValue.tz()}`}</StyledTimezoneLabel>
                    </Box>
                    <UiTimePicker dateTimeValue={dateTimeValue} setDateTimeValue={setDateTimeValue} setTimeError={setTimeError} />
                    {timeValidationError && <Alert className='mt-2' variant="filled" severity="error"> Posts must be scheduled at least 5 minutes into the future.</Alert>}
                </StyledContentArea>
                <UiButton label='Done' onClick={handleSubmit} disabled={timeValidationError} />
            </StyledContent>
        </StyledContentWrapper>}
    </StyledWrapper>
        </ClickAwayListener>
};


export default PostScheduleModal;