import React from 'react';
import styled from 'styled-components';
import { Card } from 'fe-comp-card';
import { VideoAnnouncement } from 'hooks/useVideoAnnouncements';
import breakpoints from 'utils/breakpoints';
import { Button, OUTLINED } from '../../components/Button';
import { limitText } from '../../utils/limitText';
import { Vidyard } from './VidyardLoader';

const Container = styled(Card)`
  font-family: 'Source Sans Pro';
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 579px;
  background: #fdfdfd; // TODO: Replace with Theme
  border: 1px solid #e6eaeb; // TODO: Replace with Theme
  border-radius: 8px;
  height: 539px;
  cursor: default;
  &:hover {
    outline: none;
    transform: none;
    box-shadow: none;
  }

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    width: 400px;
    height: 491px;
    flex-direction: column;
  }
`;

const ContentContainer = styled.div`
  flex-grow: 1;
  flex-shrink: 2;
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 8px;
  justify-content: space-between;
`;

const VideoContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  align-self: center;
`;

const Title = styled.div`
  font-family: 'Source Sans Pro';
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  line-height: 28px;
  color: #1c1c1c; // TODO: Replace with Theme
`;

const Description = styled.div`
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  color: #1c1c1c; // TODO: Replace with Theme
`;

const CTAText = styled.span`
  font-style: normal;
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  display: flex;
  align-items: center;
  text-align: center;
  color: #1c1c1c; // TODO: Replace with Theme
`;

const StyledButton = styled(Button)`
  display: flex;
  align-self: end;
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    width: 100%;
  }
`;

const TextWrapper = styled.div`
  width: 100%;
  height: 76px;
`;

export type VideoAnnouncementCardProps = {
  announcement: VideoAnnouncement;
};

const VideoAnnouncementCard = ({ announcement }: VideoAnnouncementCardProps) => {
  const { id, title, location, handleClick, description, cta } = announcement;
  return (
    <Container>
      <VideoContainer>
        <Vidyard video={announcement} />
      </VideoContainer>
      <ContentContainer>
        <TextWrapper>
          <Title>{limitText(title, 80)}</Title>
          {description && <Description>{limitText(description, 130)}</Description>}
        </TextWrapper>
        <StyledButton type={OUTLINED} onClick={() => handleClick(id, title, location)} width="fit-content">
          <CTAText>{cta}</CTAText>
        </StyledButton>
      </ContentContainer>
    </Container>
  );
};

export default VideoAnnouncementCard;
