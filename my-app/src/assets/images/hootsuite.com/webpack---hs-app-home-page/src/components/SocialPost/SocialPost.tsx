import React from 'react';
import { SocialProfileNetworkTypes } from 'fe-pg-comp-social-profile-connector/src/types';
import styled, { keyframes, css } from 'styled-components';
import Heart from '@fp-icons/action-heart-outline';
import Icon from '@fp-icons/icon-base';
import LogoFilledFacebook from '@fp-icons/product-logo-filled-facebook';
import LogoFilledInstagram from '@fp-icons/product-logo-filled-instagram';
import LogoFilledLinkedin from '@fp-icons/product-logo-filled-linkedin';
import LogoFilledPinterest from '@fp-icons/product-logo-filled-pinterest';
import LogoFilledTikTokBusiness from '@fp-icons/product-logo-filled-tiktok';
import LogoFilledTwitter from '@fp-icons/product-logo-filled-twitter';
import LogoFilledYoutube from '@fp-icons/product-logo-filled-youtube';
import QuestionCircle from '@fp-icons/symbol-question-circle';
import { linkify, extractUrls } from 'fe-adp-lib-linkify';
import { Card } from 'fe-comp-card';
import { withI18n } from 'fe-lib-i18n';
import { getThemeValue } from 'fe-lib-theme';
import { isInFirst30DayUXExperiment } from 'App';
import { SocialNetworkMap } from 'typings/draft';
import breakpoints from 'utils/breakpoints';
import SocialPostImages from './SocialPostImages';

export const NETWORK_FACEBOOK = 'FACEBOOK';
export const NETWORK_TWITTER = 'TWITTER';
export const NETWORK_INSTAGRAM = 'INSTAGRAM';
export const NETWORK_INSTAGRAM_BUSINESS = 'INSTAGRAMBUSINESS';
export const NETWORK_YOUTUBE = 'YOUTUBECHANNEL';
export const NETWORK_LINKEDIN = 'LINKEDIN';
export const NETWORK_LINKEDIN_COMPANY = 'LINKEDINCOMPANY';
export const NETWORK_PINTEREST = 'PINTEREST';
export const NETWORK_TIKTOKBUSINESS = 'TIKTOKBUSINESS';
export const NETWORK_LINKEDIN_PERSONAL = 'LINKEDINPERSONAL';
export const NETWORK_INSTAGRAM_PERSONAL = 'INSTAGRAMPERSONAL';
export const NETWORK_FACEBOOK_PERSONAL = 'FACEBOOKPERSONAL';
export const NETWORK_FACEBOOK_GROUP = 'FACEBOOKGROUP';
export const NETWORK_FACEBOOK_PAGE = 'FACEBOOKPAGE';

const networkMap: SocialNetworkMap = {
  [NETWORK_FACEBOOK]: {
    glyph: LogoFilledFacebook,
    name: 'Facebook',
  },
  [NETWORK_FACEBOOK_GROUP]: {
    glyph: LogoFilledFacebook,
    name: 'Facebook',
  },
  [NETWORK_FACEBOOK_PAGE]: {
    glyph: LogoFilledFacebook,
    name: 'Facebook',
  },
  [NETWORK_TWITTER]: {
    glyph: LogoFilledTwitter,
    name: 'Twitter',
  },
  [NETWORK_LINKEDIN]: {
    glyph: LogoFilledLinkedin,
    name: 'LinkedIn',
  },
  [NETWORK_LINKEDIN_COMPANY]: {
    glyph: LogoFilledLinkedin,
    name: 'LinkedIn',
  },
  [NETWORK_INSTAGRAM]: {
    glyph: LogoFilledInstagram,
    name: 'Instagram',
  },
  [NETWORK_INSTAGRAM_BUSINESS]: {
    glyph: LogoFilledInstagram,
    name: 'Instagram',
  },
  [NETWORK_YOUTUBE]: {
    glyph: LogoFilledYoutube,
    name: 'YouTube',
  },

  [NETWORK_PINTEREST]: {
    glyph: LogoFilledPinterest,
    name: 'Pinterest',
  },
  [NETWORK_TIKTOKBUSINESS]: {
    glyph: LogoFilledTikTokBusiness,
    name: 'Tiktok Business',
  },
};

const backgroundFade = keyframes`
  from {
    background-color: #e6eaeb;
  }

  to {
    background-color: #fdfdfd;
  }
`;

const Container = styled(Card)<{
  numOfImages: number;
  hasClick: boolean;
  showAnimation?: boolean;
  showFirst30DaysExperiment: boolean;
}>`
  display: grid;
  grid-template-columns: ${({ numOfImages }) => (numOfImages > 0 ? '200px 1fr' : '1fr')};
  grid-template-rows: 1fr;
  width: 100%;
  max-width: 713px;
  height: 132px;
  position: relative;
  background: #fdfdfd;
  border: ${p => (p.showFirst30DaysExperiment ? 'none' : '1px solid #e6eaeb')};
  box-shadow: ${p =>
    p.showFirst30DaysExperiment
      ? 'none'
      : p.hasClick
      ? '0px 0px 1px rgba(28, 28, 28, 0.28), 0px 1px 1px rgba(28, 28, 28, 0.16)'
      : 'none'};
  border-radius: ${p => (p.showFirst30DaysExperiment ? '4px' : '3px')};
  overflow: hidden;

  animation: ${({ showAnimation }) =>
    showAnimation &&
    css`
      ${backgroundFade} 2s linear
    `};

  &:hover {
    transform: unset;
    outline: none;
    box-shadow: ${({ hasClick }) =>
      hasClick ? '0px 0px 1px rgba(28, 28, 28, 0.28), 0px 1px 1px rgba(28, 28, 28, 0.16)' : 'none'};
    background-color: ${({ hasClick }) => (hasClick ? '#e6eaeb' : '#fdfdfd')};
  }

  &:focus {
    outline: none;
    border: 1px solid #0065ff;
  }

  @media (max-width: ${breakpoints.breakpointSm}) {
    grid-template-columns: ${({ numOfImages }) => (numOfImages > 0 ? '1fr 1fr' : '1fr')};
  }
`;

const SocialContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  padding: 6px 16px 0 0;
  justify-content: space-between;
  width: 100%;
`;

const SocialProfilesWrapper = styled.div`
  display: flex;
  flex-direction: row;
  max-height: 20px;
  font-weight: 600;
  margin-bottom: 4px;
  overflow: hidden;
`;

const Profile = styled.span`
  text-overflow: ellipsis;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  line-height: 20px;
`;

const ProfileImageWrapper = styled.div`
  margin-right: 4px;
  display: flex;
  align-items: center;
`;

const ProfileImageContainer = styled.div`
  line-height: 20px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #00977e;
  color: rgb(255, 255, 255);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
`;

const ProfileImageText = styled.p`
  height: 20px;
  color: white;
  margin: 0;
`;

const ContentContainer = styled.div`
  width: auto;
  padding: 16px 24px 16px 24px;
  display: flex;
  flex-direction: column;
  overflow-wrap: break-word;
  overflow: hidden;
  color: #1c1c1c;
`;

const TextContainer = styled.div<{ isDraft: boolean }>`
  margin-top: -2px;
  height: ${p => (p.isDraft ? '48x' : '24px')};
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 16px;
  line-height: 24px;
  display: -webkit-box;
  -webkit-line-clamp: ${p => (p.isDraft ? '2' : '1')};
  -webkit-box-orient: vertical;
`;

const DateContainer = styled.div`
  margin-top: auto;
  height: 28px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 8px;
  color: #5c5c5c;
`;

const DraftBadge = styled.span`
  display: grid;
  place-self: center;
  padding: 2px 8px;
  background: #e6eaeb;
  border-radius: 2px;
  color: #1c1c1c;
`;

const DateSpan = styled.span`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  line-height: 18px;
`;

const ScoreLabel = styled.div`
  margin-left: 8px;
`;

const ScoreWrapper = styled.div`
  height: 24px;
  width: 100%;
  display: flex;
  flex-direction: row;
  color: #1c1c1c;
  font-size: 16px;
  font-weight: 600;
  align-items: center;
  margin-top: 4px;
`;

export type SocialPostProps = {
  $i18n: {
    draft: () => string;
  };
  username: string;
  socialNetworkTypes: SocialProfileNetworkTypes[];
  creationDate?: string;
  engagement?: number;
  additionalData: string;
  showAnimation?: boolean;
  isDraft?: boolean;
  text: string;
  images?: string[];
  onClickPost?: () => void;
  onExternalUrlClick: () => void;
};

const renderSocialProfileInfo = (socialNetworkTypes: SocialProfileNetworkTypes[], username: string) => (
  <SocialProfilesWrapper>
    {!socialNetworkTypes || socialNetworkTypes.length === 0 ? (
      <>
        <ProfileImageWrapper>
          <Icon glyph={QuestionCircle} size={20} fill={'#00977E'} />
        </ProfileImageWrapper>
        <Profile>{username}</Profile>
      </>
    ) : (
      <>
        {socialNetworkTypes && socialNetworkTypes.length > 1 && (
          <ProfileImageWrapper>
            <ProfileImageContainer>
              <ProfileImageText>{socialNetworkTypes.length}</ProfileImageText>
            </ProfileImageContainer>
          </ProfileImageWrapper>
        )}
        {socialNetworkTypes && socialNetworkTypes.length === 1 && (
          <ProfileImageWrapper>
            <Icon
              fill={getThemeValue(t => t.colors.lightGrey10)}
              glyph={networkMap[socialNetworkTypes[0]].glyph}
              size={20}
            />
          </ProfileImageWrapper>
        )}
        <Profile>{username}</Profile>
      </>
    )}
  </SocialProfilesWrapper>
);

const anchorTagWithCustomOnClick =
  (customOnClick: () => void) =>
  ({ children, href, target, rel }: AnchorTagProps) => {
    return (
      <a onClick={customOnClick} href={href} target={target} rel={rel}>
        {children}
      </a>
    );
  };

const onClickSocialPost = async (onClickCallback: () => void) => {
  onClickCallback();
};

const onKeyDownSocialPost = async (onClickCallback: () => void, event: React.KeyboardEvent<HTMLButtonElement>) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClickCallback();
  }
};

type AnchorTagProps = {
  href?: string | undefined;
  target?: string | undefined;
  rel?: string | undefined;
  children?: React.ReactNode;
};

type ClickHandlerPropsType = {
  [key: string]: ((event: React.KeyboardEvent<HTMLButtonElement>) => void) | string;
};

const LocalizedSocialPost = ({
  username,
  socialNetworkTypes,
  engagement,
  additionalData,
  isDraft,
  showAnimation,
  text,
  images,
  onClickPost,
  onExternalUrlClick,
  $i18n,
}: SocialPostProps) => {
  const links = extractUrls(text || '');
  const linkifiedText = linkify(text || '', links, { LinkComponent: anchorTagWithCustomOnClick(onExternalUrlClick) });
  const clickHandlerProps: ClickHandlerPropsType = {};
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;

  if (onClickPost) {
    clickHandlerProps.onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) =>
      onKeyDownSocialPost(onClickPost, event);
    clickHandlerProps.onClick = () => onClickSocialPost(onClickPost);
  } else {
    clickHandlerProps.as = 'div';
  }

  return (
    <Container
      tabIndex={0}
      role="button"
      numOfImages={images?.length ? images.length : 0}
      hasClick={!!onClickPost}
      showAnimation={showAnimation}
      showFirst30DaysExperiment={showFirst30DaysExperiment}
      {...clickHandlerProps}
    >
      <SocialPostImages images={images || []} />
      <ContentContainer>
        <SocialContainer>{renderSocialProfileInfo(socialNetworkTypes, username)}</SocialContainer>
        <TextContainer isDraft={!!isDraft}>
          <span>{linkifiedText}</span>
        </TextContainer>
        {engagement && (
          <ScoreWrapper>
            <Icon glyph={Heart} />
            <ScoreLabel>{engagement}</ScoreLabel>
          </ScoreWrapper>
        )}
        <DateContainer>
          {isDraft && <DraftBadge>{$i18n.draft()}</DraftBadge>}
          <DateSpan>{additionalData}</DateSpan>
        </DateContainer>
      </ContentContainer>
    </Container>
  );
};

export default withI18n({
  draft: 'Draft',
})(LocalizedSocialPost);
