import React, { useState } from 'react';
import { compose } from 'fe-hoc-compose';
import { DarklaunchProps, withDarklaunch } from 'fe-lib-darklaunch';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { getActionHistoryValue, setActionHistoryValue } from 'fe-pg-lib-action-history';
import {
  TRACKING_EVENT_USER_COLLAPSES_ANNOUNCEMENTS,
  TRACKING_EVENT_USER_EXPANDS_ANNOUNCEMENTS,
  TRACKING_ORIGIN_HOMEPAGE,
} from 'constants/tracking';
import { useAnnouncements } from 'hooks/useAnnouncements';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import { ANNOUNCEMENT_WIDGET_IS_OPEN } from '../../constants/actionHistoryKeys';
import { Sizes, Widget } from '../Widget';
import AnnouncementCardList from './AnnouncementCardList';

type AnnouncementsProps = {
  $i18n: {
    title: () => string;
    expand: () => string;
    collapse: () => string;
  };
} & DarklaunchProps;

type MemberActionHistoryValue = string | number | boolean;

const Announcements = ({ $i18n, $dl }: AnnouncementsProps) => {
  const [isOpen, setIsOpen] = useState<MemberActionHistoryValue | undefined>(
    getActionHistoryValue(ANNOUNCEMENT_WIDGET_IS_OPEN),
  );
  const { announcements, isLoading } = useAnnouncements(
    !!$dl['PGR_1833_GOALS_ANNOUNCEMENT_CARDS'] && !!$dl['IMP_6306_GOALS_DASHBOARD_BETA_ACCESS'],
    !!$dl['PGR_1930_ADDONS_CARD'],
    !!$dl['PGR_1970_GTM_ANNOUNCEMENT'],
  );
  let widgetStatus;

  if (isLoading) {
    widgetStatus = RequestStatusType.LOADING;
  } else {
    widgetStatus = RequestStatusType.SUCCESS;
  }

  const onCTAClick = (isOpen: MemberActionHistoryValue | undefined) => {
    if (isOpen === undefined) {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_COLLAPSES_ANNOUNCEMENTS, {
        widgetName: WidgetName.ANNOUNCEMENTS,
      });
      setActionHistoryValue(ANNOUNCEMENT_WIDGET_IS_OPEN, false);
    } else if (isOpen) {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_COLLAPSES_ANNOUNCEMENTS, {
        widgetName: WidgetName.ANNOUNCEMENTS,
      });
      setActionHistoryValue(ANNOUNCEMENT_WIDGET_IS_OPEN, false);
    } else {
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_EXPANDS_ANNOUNCEMENTS, {
        widgetName: WidgetName.ANNOUNCEMENTS,
      });
      setActionHistoryValue(ANNOUNCEMENT_WIDGET_IS_OPEN, true);
    }

    setIsOpen(getActionHistoryValue(ANNOUNCEMENT_WIDGET_IS_OPEN));
  };

  return (
    <>
      {announcements.length > 0 && (
        <Widget
          name={WidgetName.ANNOUNCEMENTS}
          status={widgetStatus}
          size={Sizes.LARGE}
          title={$i18n.title()}
          cta={isOpen || isOpen === undefined ? $i18n.collapse() : $i18n.expand()}
          showCta={true}
          onClickCta={() => onCTAClick(isOpen)}
          isOpen={getActionHistoryValue(ANNOUNCEMENT_WIDGET_IS_OPEN)}
          isSecondary={true}
        >
          <AnnouncementCardList announcements={announcements} />
        </Widget>
      )}
    </>
  );
};

export default compose(
  withDarklaunch([
    'PGR_1833_GOALS_ANNOUNCEMENT_CARDS',
    'IMP_6306_GOALS_DASHBOARD_BETA_ACCESS',
    'PGR_1930_ADDONS_CARD',
    'PGR_1970_GTM_ANNOUNCEMENT',
  ]),
)(
  withI18n({
    title: 'New at Hootsuite',
    expand: 'Expand',
    collapse: 'Collapse',
  })(Announcements),
);
