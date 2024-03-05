'use client';

import styled from "@emotion/styled";
import { Box, Button } from "@mui/material";
import { useRef } from "react";
import MediaIcon from "@/assets/icons/media-icon.svg";

type IProps = {
    handleFile:(arg:string) => void;
}

const StyledButton = styled(Button)({
    background: "transparent",
    border: "2px dashed rgb(211, 210, 211)",
    width: "112px",
    height: "112px",
    borderRadius: "0px",
    padding: "0px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "rgb(20, 48, 89)",
    "&:hover":{ backgroundColor: "rgb(176, 185, 197)", cursor: "pointer" },
    "&:focus-visible":{ boxShadow: "rgb(11, 87, 208) 0px 0px 0px 3px" }
  })

const UiFileUploader = ({ handleFile }:IProps) => {

  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if(hiddenFileInput?.current)
    hiddenFileInput.current.click();
  };
  const handleChange = (event:React.ChangeEvent<HTMLInputElement>) => {
    const fileUploaded = (event.currentTarget as HTMLInputElement).files;
    if(fileUploaded?.length){
            const reader = new FileReader();
            reader.readAsDataURL(fileUploaded[0]);
            reader.onload = ()=> {
              console.log(reader.result);
              handleFile(reader.result as string)
            };
            reader.onerror = (error) => {
              console.log('Error: ', error);
            };
    }
  };
  return (
    <>
      <StyledButton onClick={handleClick}>
        <MediaIcon/>
      </StyledButton>
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        ref={hiddenFileInput}
        style={{ display: "none" }} // Make the file input element invisible
      />
    </>
  );
};

export default UiFileUploader;