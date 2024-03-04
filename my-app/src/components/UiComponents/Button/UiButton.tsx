'use client';

import * as React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material';

interface IProps extends ButtonProps{
  label:string;
}

const StyledButton = styled(Button)({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  minWidth: "80px",
  maxWidth: "500px",
  width: "auto",
  height: "44px",
  padding: "0px 24px",
  verticalAlign: "middle",
  fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "20px",
  textAlign: "center",
  textDecoration: "none",
  textShadow: "none",
  whiteSpace: "nowrap",
  userSelect: "none",
  transition: "background-color 0.15s ease-out 0s, border-color 0.1s ease-out 0s",
  position: "relative",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "rgb(20, 48, 89)",
  backgroundColor: "rgb(208, 214, 222)",
  borderRadius: "2px",
  "&:hover":{ 
    backgroundColor: "rgb(176, 185, 197)", 
    cursor: "pointer" 
  }
});

export default function UiButton({label,...extraProps}:IProps) {
  return (
    <StyledButton {...extraProps} >
      {label}
    </StyledButton>
  );
}