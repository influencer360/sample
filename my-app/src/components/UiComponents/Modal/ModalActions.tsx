'use client';
import React from 'react';
import { DialogActions, DialogActionsProps, styled } from '@mui/material';

const StyledActions = styled(DialogActions)(() => ({
  justifyContent: 'flex-start',
  padding: '0 0 25px 0',
}));

const ModalActions = ({ children, ...extraProps }: DialogActionsProps) => {
  return <StyledActions {...extraProps}>{children}</StyledActions>;
};

export default ModalActions;