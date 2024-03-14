import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import { styled } from '@mui/material/styles';

interface IProps extends CheckboxProps {
  label?: string;
  error?: boolean;
}

const StyledCheckbox = styled(Checkbox)(({
  '& .HpCheckBox-root': {
    width: '40px',
    height: '40px',
  },
  '&.Mui-checked': {
    color:'#000000',
  },
}));


export default function UiCheckbox({ label, ...extraProps }: IProps) {
    return (
      <StyledCheckbox
        {...extraProps}
      />
    );
}