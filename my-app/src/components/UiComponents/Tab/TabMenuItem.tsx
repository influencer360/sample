'use client';
import React from 'react';
import Tab, { TabProps } from '@mui/material/Tab';
import { styled } from '@mui/material/styles';

interface IProps extends TabProps {
  index: number;
}

const StyledTab = styled(Tab)({
  minWidth: "44px",
  boxSizing: "border-box",
  lineHeight: 1,
  fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
  fontWeight: 700,
  fontSize: "16px",
  color: '#0B0C10',
  backgroundColor:"rgb(252, 252, 251)",
  verticalAlign: "middle",
  textAlign: "center",
  wordBreak: "break-all",
  borderRadius: "5px",
  cursor: "pointer",
  minHeight:"38px",
  '&.Mui-selected': {
    color: "rgb(252, 252, 251)",
    backgroundColor: "rgb(20, 48, 89)"
  },
});

const a11yProps = (index: number) => {
  return {
    id: `hp-tab-${index}`,
    'aria-controls': `hp-tabpanel-${index}`,
  };
};

const TabMenuItem = ({ index, ...extraProps }: IProps) => {
  return (<StyledTab {...extraProps} {...a11yProps(index)} />);
};

export default TabMenuItem;