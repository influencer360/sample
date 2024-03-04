import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Icon from '@fp-icons/icon-base';
import SymbolPlay from '@fp-icons/symbol-play';
import { getLanguage } from 'fe-lib-hs';
import { track } from 'fe-lib-tracking';
import { isInFirst30DayUXExperiment } from 'App';
import { LANGUAGE_MAP } from 'constants/languages';
import {
  TRACKING_EVENT_USER_COMPLETES_VIDEO,
  TRACKING_EVENT_USER_PLAYS_VIDEO,
  TRACKING_ORIGIN_HOMEPAGE,
} from 'constants/tracking';
import { VideoAnnouncement } from 'hooks/useVideoAnnouncements';
import breakpoints from 'utils/breakpoints';

const appearAnimation = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`;

const VidyardImage = styled.img<{ visible?: boolean }>`
  width: 100%;
  margin: auto;
  display: ${p => (p.visible ? 'block' : 'none')};
`;

const VidyardContainer = styled.div<{ showFirst30DaysExperiment: boolean }>`
  animation-name: ${appearAnimation};
  animation-duration: 1s;
  animation-delay: 0.5s;
  animation-fill-mode: forwards;
  opacity: 0;
  width: 100%;
  && > div {
    border-radius: ${p => (p.showFirst30DaysExperiment ? '8px' : '8px 8px 0 0')}};
    border: 1px solid #f7f8f9;
  }
`;

const TimeStamp = styled.div`
  display: none;
  position: absolute;
  transform: translateY(-28px);
  left: 8px;

  color: #fff;
  font-family: 'Source Sans Pro';
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: 16px; /* 133.333% */
  padding: 2px 4px;
  border-radius: 4px !important; // Remove !important if first30DayExperiment var 1 becomes permanent
  background: #333333a3;
  width: auto;
  height: auto;
`;

const TimeStampWrapper = styled.span`
  margin-left: 4px;
`;

// !important because the base icon component uses inline styles
// so normal css specificity practices cant override it.
const PlaySymbol = styled(Icon)`
  vertical-align: baseline !important;
`;

export const formatTimeStamp = (duration: number) => {
  const mins = ~~((duration % 3600) / 60);
  const secs = ~~duration % 60;

  let formattedTime = '';

  formattedTime += `${mins}:${secs < 10 ? '0' : ''}`;
  formattedTime += `${secs}`;

  return formattedTime;
};

const EMBEDDED_VIDEO_BASE_URL = 'https://secure.vidyard.com/organizations/2409179/embed_select/';

type VidyardProps = {
  video: VideoAnnouncement;
};

const hideTimestamp = (timestampId: string) => {
  const timestamp = document.getElementById(timestampId);
  if (timestamp) {
    timestamp.style.display = 'none';
  }
};

const showTimestamp = (timestampId: string) => {
  const timestamp = document.getElementById(timestampId);
  if (timestamp) {
    timestamp.style.display = 'block';
  }
};

const Vidyard: React.FC<VidyardProps> = props => {
  const { id, src, altText, duration, title } = props.video;

  // first player will add the script to the head
  useEffect(() => {
    const embedScript = document.createElement('script');
    embedScript.type = 'text/javascript';
    embedScript.async = true;
    embedScript.id = 'vidyard-embed';
    embedScript.src = 'https://play.vidyard.com/embed/v4.js';
    document.head.appendChild(embedScript);

    return () => {
      const embedScript = document.getElementById('vidyard-embed');
      if (embedScript) {
        document.head.removeChild(embedScript);
      }
    };
  }, []);

  window.onVidyardAPI = (vidyardEmbed: VidyardEmbed) => {
    vidyardEmbed.api.addReadyListener(async (_: any, player: any) => {
      const language = await getLanguage();
      if (player && player.ready()) {
        player.on('ready', () => {
          showTimestamp(player.uuid);
        });
        player.on('play', () => {
          hideTimestamp(player.uuid);
          player.enableCaption(LANGUAGE_MAP[language].name, LANGUAGE_MAP[language].code);
          window.VidyardV4.players.forEach(otherVideo => {
            if (otherVideo.uuid !== player.uuid) {
              otherVideo.pause();
            }
          });
          track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_PLAYS_VIDEO, { id, title });
        });
        player.on('chapterComplete', () => {
          showTimestamp(player.uuid);
          track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_COMPLETES_VIDEO, { id, title });
        });
      }
    });
  };

  return (
    <>
      <VidyardContainer showFirst30DaysExperiment={isInFirst30DayUXExperiment} id={`vidyard-${id}`}>
        <VidyardImage
          className="vidyard-player-embed"
          src={EMBEDDED_VIDEO_BASE_URL + src}
          data-uuid={src}
          data-v="4"
          data-type="inline"
          alt={altText}
        />

        <TimeStamp id={src}>
          <PlaySymbol size={12} glyph={SymbolPlay} />
          <TimeStampWrapper>{formatTimeStamp(duration)}</TimeStampWrapper>
        </TimeStamp>
      </VidyardContainer>
    </>
  );
};

export { Vidyard };
