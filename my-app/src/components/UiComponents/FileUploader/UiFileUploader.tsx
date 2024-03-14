'use client';

import styled from "@emotion/styled";
import { Box, Button } from "@mui/material";
import { useRef } from "react";
import MediaIcon from "@/assets/icons/media-icon.svg";
import LibraryIcon from '@/assets/icons/library-icon.svg';
import { useActions } from "@/lib/hooks";
import { ImgType } from "@/utils/commonTypes";

type IProps = {
    handleFile: (arg: File[]) => void;
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
    "&:hover": { backgroundColor: "rgb(176, 185, 197)", cursor: "pointer" },
    "&:focus-visible": { boxShadow: "rgb(11, 87, 208) 0px 0px 0px 3px" }
})

const UiFileUploader = ({ handleFile }: IProps) => {



    const { openMediaGalleryModal } = useActions();

    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const handleClick = () => {
        if (hiddenFileInput?.current)
            hiddenFileInput.current.click();
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileUploaded = (event.currentTarget as HTMLInputElement).files;
        if (fileUploaded?.length) {
            handleFile(Array.from(fileUploaded));
        }
    };
    return (
        <>
            <Box className="flex gap-2">
                <Box>
                    <StyledButton onClick={handleClick}>
                        <MediaIcon />
                    </StyledButton>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        ref={hiddenFileInput}
                        style={{ display: "none" }} // Make the file input element invisible
                        multiple
                        name="files[]"
                    />
                </Box>
                <Box>
                    <StyledButton onClick={() => openMediaGalleryModal()}>
                        <LibraryIcon />
                    </StyledButton>
                </Box>

            </Box>

        </>
    );
};

export default UiFileUploader;