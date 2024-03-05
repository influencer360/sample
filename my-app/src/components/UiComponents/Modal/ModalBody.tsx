'use client';
import React from 'react';
import { DialogContent, styled } from '@mui/material';
import { DialogContentProps } from '@mui/material/DialogContent/DialogContent';

const StyledDialogContent = styled(DialogContent)(() => ({
  margin: '25px 0',
  padding: '0',
}));

const ModalBody = ({ children, ...extraProps }: DialogContentProps) => {
  return <StyledDialogContent {...extraProps}>{children}</StyledDialogContent>;
};

export default ModalBody;