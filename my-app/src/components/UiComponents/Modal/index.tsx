'use client';
import React from 'react';
import { Dialog, styled } from '@mui/material';
import { DialogProps } from '@mui/material/Dialog/Dialog';

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    padding: '0 25px',
    borderRadius: '8px',
    minWidth: '764px',
    background:'#ffffff'
  },
}));

const Modal = ({ children, ...extraProps }: DialogProps) => {
  return <StyledDialog {...extraProps}>{children}</StyledDialog>;
};

export default Modal;