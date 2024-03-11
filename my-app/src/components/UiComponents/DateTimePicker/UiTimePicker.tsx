'use client';
import * as React from 'react';
import { DemoContainer, DemoItem } from '@mui/x-date-pickers/internals/demo';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Moment } from 'moment';

export default function UiTimePicker({dateTimeValue,setDateTimeValue,setTimeError}:{dateTimeValue:Moment,setDateTimeValue:React.Dispatch<React.SetStateAction<Moment>>,setTimeError:React.Dispatch<React.SetStateAction<boolean>>}) {

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DemoContainer
        components={['MobileTimePicker', 'MobileTimePicker']}
      >
        <DemoItem>
            <TimePicker 
                value={dateTimeValue} 
                onChange={(newValue) => setDateTimeValue(newValue as Moment)}
                onError={()=>setTimeError(true)}
                disablePast={true}
                closeOnSelect={true} 
                views={['hours']}
                label={'Hours'} 
            />
        </DemoItem>
        <DemoItem>
            <TimePicker
                label={'Minutes'} 
                value={dateTimeValue} 
                onChange={(newValue) => setDateTimeValue(newValue as Moment)}
                onError={()=>setTimeError(true)}
                disablePast={true}
                closeOnSelect={true}
                views={['minutes']} 
            />
        </DemoItem>
      </DemoContainer>
    </LocalizationProvider>
  );
}