import React from 'react';
import Tabs, { TabsProps } from '@mui/material/Tabs';
import { styled } from '@mui/material/styles';

const StyledTabs = styled(Tabs)({
  boxShadow: 'inset 0px -1px 0px 0px rgba(100, 106, 124, 0.2)',
  '& .MuiTabs-flexContainer': {
    gap: '8px',
  },
  '& .MuiTabs-indicator': {
    display:'none',
    backgroundColor: '#18768C',
  },
});

const TabMenu = ({ children, ...extraProps }: TabsProps) => {
  return <StyledTabs {...extraProps}>{children}</StyledTabs>;
};

export default TabMenu;