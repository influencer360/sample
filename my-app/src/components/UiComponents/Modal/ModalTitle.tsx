'use client';
import React from 'react';
import { DialogTitle, styled } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { DialogTitleProps } from '@mui/material/DialogTitle/DialogTitle';

interface IProps extends DialogTitleProps {
  onClose?: () => void;
}

const StyledDialogTitle = styled(DialogTitle)(() => ({
  padding: '25px 0 0 0',
  fontWeight: '500',
  fontSize: '31px',
  lineHeight: '41px',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: 8,
  top: 8,
  color: theme.palette.grey[500],
}));

const ModalTitle = ({ children, onClose, ...extraProps }: IProps) => {
  return (
    <StyledDialogTitle {...extraProps}>
      {children}
      {onClose ? (
        <StyledIconButton
          aria-label='close'
          onClick={onClose}
        >
          <CloseIcon />
        </StyledIconButton>
      ) : <></>}
    </StyledDialogTitle>
  );
};

export default ModalTitle;