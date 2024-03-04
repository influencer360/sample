import React, { useState } from 'react';
import { compose } from 'fe-hoc-compose';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import {
  getActionHistoryValue,
  setActionHistoryValue,
  ActionHistoryProps,
  withActionHistory,
} from 'fe-pg-lib-action-history';
import {
  TRACKING_EVENT_USER_COLLAPSES_VIDEO_ANNOUNCEMENTS,
  TRACKING_EVENT_USER_EXPANDS_VIDEO_ANNOUNCEMENTS,
  TRACKING_ORIGIN_HOMEPAGE,
} from 'constants/tracking';
import { useVideoAnnouncements } from 'hooks/useVideoAnnouncements';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import { VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN } from '../../constants/actionHistoryKeys';
import { Sizes, Widget } from '../Widget';
import VideoAnnouncementCardList from './VideoAnnouncementsCardList';

type AnnouncementsProps = {
  $i18n: {
    title: () => string;
    expand: () => string;
    collapse: () => string;
  };
  $actionHistory: ActionHistoryProps;
};

type MemberActionHistoryValue = string | number | boolean;

const VideoAnnouncements = ({ $i18n, $actionHistory }: AnnouncementsProps) => {
  const [isOpen, setIsOpen] = useState<MemberActionHistoryValue | undefined>(
    getActionHistoryValue(VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN),
  );
  const { announcements, isLoading } = useVideoAnnouncements($actionHistory);
  let widgetStatus;

  if (isLoading) {
    widgetStatus = RequestStatusType.LOADING;
  } else {
    widgetStatus = RequestStatusType.SUCCESS;
  }

  const onCTAClick = (isOpen: MemberActionHistoryValue | undefined) => {
    if (isOpen === undefined) {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_COLLAPSES_VIDEO_ANNOUNCEMENTS, {
        widgetName: WidgetName.VIDEO_ANNOUNCEMENTS,
      });
      setActionHistoryValue(VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN, false);
    } else if (isOpen) {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_COLLAPSES_VIDEO_ANNOUNCEMENTS, {
        widgetName: WidgetName.VIDEO_ANNOUNCEMENTS,
      });
      setActionHistoryValue(VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN, false);
    } else {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_EXPANDS_VIDEO_ANNOUNCEMENTS, {
        widgetName: WidgetName.VIDEO_ANNOUNCEMENTS,
      });
      setActionHistoryValue(VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN, true);
    }

    setIsOpen(getActionHistoryValue(VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN));
  };

  return (
    <>
      {announcements.length > 0 && (
        <Widget
          name={WidgetName.VIDEO_ANNOUNCEMENTS}
          status={widgetStatus}
          size={Sizes.LARGE}
          title={$i18n.title()}
          cta={isOpen || isOpen === undefined ? $i18n.collapse() : $i18n.expand()}
          showCta={true}
          onClickCta={() => onCTAClick(isOpen)}
          isOpen={getActionHistoryValue(VIDEO_ANNOUNCEMENT_WIDGET_IS_OPEN)}
          isSecondary={true}
        >
          <VideoAnnouncementCardList announcements={announcements} />
        </Widget>
      )}
    </>
  );
};

export default compose(
  withI18n({
    title: 'Our social media expert is here to help you get started!',
    expand: 'Expand',
    collapse: 'Collapse',
  }),
  withActionHistory,
)(VideoAnnouncements);
