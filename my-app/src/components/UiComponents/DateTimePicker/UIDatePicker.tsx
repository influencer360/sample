'use client';
import * as React from 'react';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField, styled } from '@mui/material';
import moment,{ Moment } from 'moment';

export default function UiDatePicker({dateTimeValue,setDateTimeValue}:{dateTimeValue:Moment,setDateTimeValue:React.Dispatch<React.SetStateAction<Moment>>}) {

  const StyledDatePicker = styled(DatePicker)({
    '& .MuiTextField-root':{
    minWidth:'100%',
    color: "rgb(36, 31, 33)",
    backgroundColor: "rgb(252, 252, 251)",
    border: "none",
    boxShadow: "rgb(124, 121, 122) 0px 0px 0px 1px",
    borderRadius: "0px",
    fontSize: "16px",
    lineHeight: "20px"
    }
  });

  const StyledTextField =styled(TextField)({
    minWidth:'100% !important',
    })


  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DemoContainer components={['DatePicker']}>
        <StyledDatePicker 
          value={dateTimeValue} 
          onChange={(newValue) => setDateTimeValue(newValue as Moment)}
          closeOnSelect={true}
          disablePast={true}
          slots={{textField:(params)=>{
            const {value,...restProps}  = params;
            const myValue = value as string
            return <StyledTextField value={moment(myValue).format('LL')} {...restProps} />
          }}}
        />
      </DemoContainer>
    </LocalizationProvider>
  );
}