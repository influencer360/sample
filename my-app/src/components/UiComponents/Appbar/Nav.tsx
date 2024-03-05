// TODO: To change this to server component by moving out the state of the toggle.
'use client';


import { Drawer, styled } from '@mui/material';
import React, { ReactNode } from 'react';

type IProps ={
  children:ReactNode;
  toggleSidebar?:(newOpen:boolean)=>void;
  status?:boolean;
}

const StyledSidebar = styled('div')({
  display:'flex',
  flexDirection:'column',
  color: 'rgb(227, 221, 216)',
  backgroundColor: 'rgb(20 48 89)'
})


export default function Appbar({ children,toggleSidebar,status }: IProps) {

  const [open, setOpen] = React.useState(toggleSidebar?status:true);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
    if(toggleSidebar)toggleSidebar(newOpen);
  };


  return (
    <StyledSidebar className='w-full min-h-full'>
        {children}
      </StyledSidebar>
  );
}
