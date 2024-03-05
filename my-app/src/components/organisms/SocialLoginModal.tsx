'use client';
import { useActions, useAppSelector } from '@/lib/hooks';
import React from 'react';
import Modal from '../UiComponents/Modal';
import ModalTitle from '../UiComponents/Modal/ModalTitle';
import ModalBody from '../UiComponents/Modal/ModalBody';
import styled from '@emotion/styled';
import { Box, Grid, Typography } from '@mui/material';
import FacebookIcon from '@/assets/icons/facebook-icon.svg';
import InstagramIcon  from '@/assets/icons/instagram-icon.svg';
import LinkedInIcon from '@/assets/icons/linkedIn-icon.svg';
import { IUserInfoDropdown } from '@/utils/commonTypes';


// delete modal has different width in UI. To keep the logic intact Within this component for add, edit and delete,
// the component is provided with a conditional style rather than employing a dedicated molecule currently.


const StyledSocialBox = styled('div')({
  display: "flex",
  alignItems: "center",
  justifyContent: "start",
  flexDirection: "column",
  flexGrow: 1,
  width: "100%",
  padding: "20px 10px 10px",
  background: "rgb(252, 252, 251)",
  border: "2px solid rgb(232, 234, 238)",
  borderRadius: "2px",
  boxShadow: "rgb(232, 234, 238) 2px 2px 0px 0px",
  transition: "all 0.1s ease-in-out 0s",
  minHeight: '100px',
  '&:hover': { boxShadow: "rgb(208, 214, 222) 4px 4px 4px 4px" },
  cursor: 'pointer'
})

const StyledAddToBox = styled('div')({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: '20px'
});

const StyledBorderTextBox = styled('div')({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "44px",
  padding: "0px 28px",
  borderRadius: "50px",
  color: "rgb(20, 48, 89)",
  backgroundColor: "rgb(208, 214, 222)",
  fontWeight: "bold",
  overflow: "hidden",
  marginLeft: '10px'
});


type IUserInfoMapType = {facebook:IUserInfoDropdown,linkedIn:IUserInfoDropdown,instagram:IUserInfoDropdown}

export default function SocialLoginModal() {


  const initialValues = useAppSelector(
    (state) => state.userInfoModal.initialValues
  );

  const isOpen = useAppSelector((state) => state.userInfoModal.isOpen);

  const { closeUserInfoModal, addSocialUser } =
    useActions();

  const handleClose = () => {
    closeUserInfoModal();
  };

  const onSubmit = async () => {

  };


  const clickHandler = (id: String) => {

    const socialId = id as keyof IUserInfoMapType;

    const userTypeMap :IUserInfoMapType = {
      facebook: {
        id: Date.now(),
        userName: `Facebook User${Date.now()}`,
        socialIcon: '',
        userAvatar: '',
        socialAccount:'facebook'
      },
      linkedIn: {
        id: Date.now(),
        userName: `LinkedIn User${Date.now()}`,
        socialIcon: '',
        userAvatar: '',
        socialAccount: 'linkedIn'
      },
      // youtube:{
      //   id: Date.now(),
      //   userName: `Youtube User${Date.now()}`,
      //   socialIcon: '',
      //   userAvatar: '',
      //   socialAccount:'youtube'
      // },
      instagram:{
        id: Date.now(),
        userName: `Instagram User${Date.now()}`,
        socialIcon: '',
        userAvatar: '',
        socialAccount:'instagrams'
      }
    }
    if(userTypeMap[socialId])addSocialUser(userTypeMap[socialId]);
  }


  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      disableEscapeKeyDown={true}
    >
      <ModalTitle onClose={handleClose}>{'Add an account to Hootsuite'}</ModalTitle>
      <ModalBody>
        <StyledAddToBox >
          <Typography sx={{ fontWeight: 400 }}>
            Add To :
          </Typography>
          <StyledBorderTextBox>
            <Typography sx={{ fontWeight: 'bold' }}>Private accounts</Typography>
          </StyledBorderTextBox>
        </StyledAddToBox>
        <Grid sx={{ padding: '20px' }} container spacing={{ xs: 1, md: 2 }} columns={{ xs: 4, sm: 8, md: 12 }}>
          {initialValues.map((item, key) => (
            <Grid item xs={2} sm={2} md={2} key={key} onClick={() => clickHandler(item.id)}>
              <StyledSocialBox key={key}>
                <Box>
                  {item.id === 'facebook' && <FacebookIcon />}
                  {item.id === 'linkedIn' && <LinkedInIcon />}
                  {item.id === 'instagram' && <InstagramIcon />}
                </Box>
                {item.name}
              </StyledSocialBox>
            </Grid>
          ))}
        </Grid>
      </ModalBody>
    </Modal>
  );
}