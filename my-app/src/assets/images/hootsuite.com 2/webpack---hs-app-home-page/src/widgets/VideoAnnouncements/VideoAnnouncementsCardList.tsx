import React, { memo } from 'react';
import styled from 'styled-components';
import ArrowLeft from '@fp-icons/arrow-left';
import ArrowRight from '@fp-icons/arrow-right';
import Icon from '@fp-icons/icon-base';
import { Button, ICON, SIZE_44 } from 'fe-comp-button';
import useScrollingCarousel from 'hooks/useScrollingCarousel';
import { VideoAnnouncement } from 'hooks/useVideoAnnouncements';
import { WidgetName } from 'typings/Widget';
import breakpoints from 'utils/breakpoints';
import VideoAnnouncementCard from './VideoAnnouncementsCard';

const ANNOUNCEMENT_GAP_WIDTH = 16;

const AnnouncementCardContainer = styled.div<{ isOverflowing: boolean }>`
  position: relative;
  transition: margin 350ms cubic-bezier(0.4, 0, 0.3, 1);

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-self: center;
  width: 100%;
`;

const ButtonWrapper = styled.div`
  height: auto;
  width: 50px;
  top: 0;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  transition: all 350ms cubic-bezier(0.4, 0, 0.3, 1);
  overflow: hidden;
  z-index: 300;

  &:last-child {
    left: calc(100% + 18px);
  }

  &:first-child {
    right: calc(100% - 46px);
  }

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    &:last-child {
      left: calc(100% + 34px);
    }
    &:first-child {
      right: calc(100% - 30px);
    }
  }
`;

const ScrollWrapper = styled.div`
  padding: 2px;
  flex: 1 1 auto;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  display: flex;
  flex-wrap: nowrap;
  gap: ${ANNOUNCEMENT_GAP_WIDTH}px;
  max-width: calc(100vw - 310px);

  @media screen and (prefers-reduced-motion: no-preference) {
    scroll-behavior: smooth;
  }

  // Hide scrollbar for Chrome, Safari and Opera
  &::-webkit-scrollbar {
    display: none;
  }
  // Hide scrollbar for IE, Edge and Firefox
  -ms-overflow-style: none; // IE and Edge
  scrollbar-width: none; // Firefox

  position: relative;
`;

const ScrollItem = styled.div`
  scroll-snap-align: start;
  padding-left: 2px;
`;

const StyledButton = styled(Button)`
  left: 3px;
  background: none;
  &[disabled] {
    opacity: 0.5;
    cursor: default;
    pointer-events: none;
    background: none;
  }
  &:hover:not([disabled]):not(:active) {
    background: none;
    opacity: 0.9;
  }
  &:active {
    background: none;
  }
  &:focus {
    background: none;
    outline: 2px solid #0065ff;
    padding: -2px;
  }
  &:focus-visible {
    background: none;
    outline: 2px solid #0065ff;
  }
`;

type VideoAnnouncementCardListProps = {
  announcements: VideoAnnouncement[];
};
type VideoAnnouncementCardListItemProps = {
  announcement: VideoAnnouncement;
};

const MemoizedAnnouncementCard = memo(VideoAnnouncementCard);

const VideoAnnouncementCardListItem = ({ announcement }: VideoAnnouncementCardListItemProps): JSX.Element => {
  return (
    <ScrollItem className={`announcement-card card-${announcement.id}`}>
      <MemoizedAnnouncementCard announcement={announcement} />
    </ScrollItem>
  );
};

const VideoAnnouncementCardList = ({ announcements }: VideoAnnouncementCardListProps) => {
  const { ref, goToNextGroup, goToPreviousGroup, isAtStart, isAtEnd, isOverflowing } =
    useScrollingCarousel<HTMLDivElement>('inline', 5, WidgetName.VIDEO_ANNOUNCEMENTS);

  return (
    <AnnouncementCardContainer isOverflowing={isOverflowing}>
      <ButtonWrapper>
        <StyledButton
          disabled={isAtStart}
          type={ICON}
          height={SIZE_44}
          onClick={() => {
            goToPreviousGroup();
          }}
        >
          <Icon size={16} glyph={ArrowLeft} />
        </StyledButton>
      </ButtonWrapper>
      <ScrollWrapper ref={ref}>
        {announcements.map((announcement: VideoAnnouncement) => (
          <VideoAnnouncementCardListItem announcement={announcement} key={announcement.id} />
        ))}
      </ScrollWrapper>
      <ButtonWrapper>
        <StyledButton
          disabled={isAtEnd}
          type={ICON}
          height={SIZE_44}
          onClick={() => {
            goToNextGroup();
          }}
        >
          <Icon size={16} glyph={ArrowRight} />
        </StyledButton>
      </ButtonWrapper>
    </AnnouncementCardContainer>
  );
};

export default VideoAnnouncementCardList;
