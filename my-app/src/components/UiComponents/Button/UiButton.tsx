

'use client';

import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material';

interface IProps extends ButtonProps{
  label:string;
}

const StyledButton = styled(Button)({
  height: "76px",
});

export default function UiButton({label,...extraProps}:IProps) {
  return (
    <StyledButton {...extraProps} >
      {label}
    </StyledButton>
  );
}