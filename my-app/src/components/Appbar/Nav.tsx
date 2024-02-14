// TODO: To change this to server component by moving out the state of the toggle.
'use client';


import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import React, { ReactNode } from 'react';




export default function Appbar({ children }: { children: ReactNode }) {

  return (<Box sx={{ display: 'flex' }}>
    <CssBaseline />
    <Box
      component="main"
      sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` }, height: `calc(100% - 60px)` }}
    > {children}
    </Box>
  </Box>
  );
}




