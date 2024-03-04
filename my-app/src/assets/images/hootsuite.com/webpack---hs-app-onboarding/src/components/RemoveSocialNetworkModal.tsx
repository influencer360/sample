/* eslint-disable react/prop-types */
import React from 'react';
import styled from 'styled-components';
import { Avatar } from 'fe-comp-avatar';
import { Content, Dialog, Footer, Icons } from 'fe-comp-dialog';
import { TranslationFunc, withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { TRACKING_ORIGIN_ACCOUNT_SETUP } from '../constants/tracking';
import { ProfileListType } from '../typings/SocialProfile';
import { Lightbox } from './Lightbox';
import { SocialProfileBadge } from './SocialProfileBadge';

const StyledModal = styled(Dialog)<{ children: React.ReactNode[] }>`
  display: flex;
  flex-direction: column;
  padding: 0px;
  width: 638px;
  height: 301px;
  border: none;
  box-shadow: 0px 4px 44px rgba(0, 0, 0, 0.25);
`;

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #004963;
  padding: 12px 15px 12px 32px;
  border: none;
`;

const CloseButtonWrapper = styled.div`
  && button[aria-label='Close'] {
    background-color: transparent;

    svg {
      width: 24px;
      height: 24px;
      fill: #ffffff;
    }
  }

  & div:first-child {
    position: static;
  }
`;

const StyledTitle = styled.h2`
  font-family: Montserrat, 'Helvetica Neue', Arial, Helvetica;
  font-weight: 700;
  font-size: 20px;
  line-height: 28px;
  color: #ffffff;
  margin: 0;
`;

const StyledContent = styled(Content)`
  font-family: Montserrat, 'Helvetica Neue', Arial, Helvetica;
  display: flex;
  flex-direction: column;
  padding: 32px;
  flex-grow: 1;
  color: #012b34;
  background-color: #ffffff;
`;

const SocialProfileArea = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding-top: 25px;
`;

const Username = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
`;

const SocialNetwork = styled.p`
  margin-top: 4px;
  text-transform: capitalize;
`;

const StyledFooter = styled.div`
  display: flex;
  background-color: #ffffff;
  padding: 16px;
  max-height: 44px;
  justify-content: space-between;
`;

const PrimaryButtonWrapper = styled.div`
  && > button {
    font-family: Montserrat, 'Helvetica Neue', Arial, Helvetica;

    background-color: #012b34;
    color: white;
    width: 125px;
    height: 44px;

    &:hover,
    &:hover:not([disabled]):not(:active) {
      background-color: #678085;
    }
    &:active {
      background-color: #34555d;
    }

    &[disabled] {
      background-color: #ccd5d6;
    }
  }
`;

const SecondaryButtonWrapper = styled.div`
  && > button {
    font-family: Montserrat, 'Helvetica Neue', Arial, Helvetica;
    background-color: #ffffff;
    border: 1px solid #012b34;
    color: #012b34;
    width: 113px;
    height: 44px;

    &:hover,
    &:hover:not([disabled]):not(:active) {
      background-color: #678085;
    }
    &:active {
      background-color: #34555d;
    }

    &[disabled] {
      background-color: #ccd5d6;
    }
  }
`;

export type RemoveSocialNetworkModalProps = {
  $i18n: {
    title: TranslationFunc;
    body: TranslationFunc;
    remove: TranslationFunc;
    cancel: TranslationFunc;
  };
  profile: ProfileListType;
  onClose: () => void;
  onClickOk: () => void;
  onClickCancel: () => void;
};

const TypedIcon = styled(Icons)<{ children?: React.ReactNode }>``;

const RemoveSocialNetworkModal = ({ $i18n, onClickOk, profile }: RemoveSocialNetworkModalProps): JSX.Element => {
  return (
    <Lightbox>
      {({ close }: { close: () => void }) => {
        return (
          <StyledModal
            withA11y
            onEscapeKeyPress={() => {
              track(TRACKING_ORIGIN_ACCOUNT_SETUP, 'user_dismissed_remove_social_network_modal');
              close();
            }}
          >
            <StyledHeader>
              <StyledTitle>{$i18n.title()}</StyledTitle>
              <CloseButtonWrapper>
                <TypedIcon>
                  <Icons.Close
                    close={() => {
                      track(TRACKING_ORIGIN_ACCOUNT_SETUP, 'user_dismissed_remove_social_network_modal');
                      close();
                    }}
                  />
                </TypedIcon>
              </CloseButtonWrapper>
            </StyledHeader>
            <StyledContent>
              {$i18n.body()}
              <SocialProfileArea>
                <Avatar
                  src={profile.avatar}
                  badge={<SocialProfileBadge network={profile.type} size={20} />}
                  size={48}
                />
                <div>
                  <Username>{profile.username}</Username>
                  <SocialNetwork>{profile.type.toLocaleLowerCase()}</SocialNetwork>
                </div>
              </SocialProfileArea>
            </StyledContent>
            <StyledFooter>
              <SecondaryButtonWrapper>
                <Footer.Buttons.SecondaryAction
                  onClick={() => {
                    track(TRACKING_ORIGIN_ACCOUNT_SETUP, 'user_dismissed_remove_social_network_modal');
                    close();
                  }}
                >
                  {$i18n.cancel()}
                </Footer.Buttons.SecondaryAction>
              </SecondaryButtonWrapper>
              <PrimaryButtonWrapper>
                <Footer.Buttons.PrimaryAction
                  onClick={() => {
                    onClickOk();
                    close();
                  }}
                >
                  {$i18n.remove()}
                </Footer.Buttons.PrimaryAction>
              </PrimaryButtonWrapper>
            </StyledFooter>
          </StyledModal>
        );
      }}
    </Lightbox>
  );
};

export default withI18n({
  title: 'Hold Up!',
  body: 'Are you sure you want to remove this account?',
  remove: 'Remove',
  cancel: 'Cancel',
})(RemoveSocialNetworkModal);
