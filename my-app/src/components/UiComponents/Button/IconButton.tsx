'use client';
import React from 'react';
import styled from "@emotion/styled";
import { Button } from "@mui/material";


const UiIconButton = styled(Button)({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    maxWidth: "500px",
    width: "auto",
    height: "28px",
    verticalAlign: "middle",
    fontFamily: '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial',
    fontSize: "16px",
    fontWeight: 700,
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
    minWidth: "28px",
    padding: "0px",
    lineHeight: 0,
    borderRadius: "50%",
    '&:hover': { backgroundColor: "rgb(176, 185, 197)", cursor: "pointer" }
});


export default UiIconButton;