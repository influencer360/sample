'use client';
import styled from '@emotion/styled';
import { Box } from '@mui/material';
import React from 'react';

const StyledPreviewWrapper = styled(Box)({
    flex: "0 0 auto",
    display: "flex",
    flexFlow: "column",
    justifyContent: "flex-start",
    width: "100%",
    height: "auto"
});
const StyledPreviewHeaderWrapper = styled(Box)({
    flex: "0 0 auto",
    width: "100%", 
    marginBottom: "16px",
    display: "flex",
    flexFlow: "row",
    justifyContent: "flex-start",
    alignItems: "center"
})

const LinkedInPostPreview = () => {
    return <StyledPreviewWrapper>
        <StyledPreviewHeaderWrapper>
            <h2>Hello I am </h2>
        </StyledPreviewHeaderWrapper>
    </StyledPreviewWrapper>
}

export default LinkedInPostPreview;