import { useEffect, useState } from 'react';
import { ActionHistoryProps } from 'fe-pg-lib-action-history';
import { useVideoAnnouncements } from 'hooks/useVideoAnnouncements';
import { RequestStatusType } from 'typings/Shared';
import { SRSConfigResponse } from 'typings/SocialRelationshipScore';
import darklaunch from 'utils/darklaunch';

const useHandleSRSDisplay = (
  srsConfig: SRSConfigResponse,
  srsConfigStatus: RequestStatusType,
  $actionHistory: ActionHistoryProps,
) => {
  const [showOnboardingContent, setShowOnboardingContent] = useState(false);
  const [showSRSBanner, setShowSRSBanner] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const { announcements } = useVideoAnnouncements($actionHistory);

  const isOnboardingContentEnabled = !!darklaunch.isFeatureEnabled('PGR_2044_HOMEPAGE_ONBOARDING_CONTENT');
  const isSRSEnabled = !!darklaunch.isFeatureEnabled('SRS_67_SRS_INTENT_TEST_ACCESS');

  const userInTrial = () => {
    const trialEndDate = new Date(window.hs.memberTrialEndDate);
    const trialEndTime = trialEndDate.getTime();
    const currentTime = Date.now();

    return currentTime < trialEndTime;
  };

  useEffect(() => {
    const showOnboardingAnnouncementWidget = announcements.length > 0 && userInTrial();
    showOnboardingAnnouncementWidget
      ? setShowOnboardingContent(isOnboardingContentEnabled)
      : setShowOnboardingContent(false);

    //Enable SRS Banner when user haven't made a decision yet to either opt-in or out
    setShowSRSBanner(!showOnboardingContent && isSRSEnabled && srsConfig === null);

    //Enable Announcements back when it's confirmed user opted-out, fetch failed or not enabled
    setShowAnnouncements(
      !showOnboardingContent &&
        (!isSRSEnabled ||
          (srsConfigStatus === RequestStatusType.SUCCESS && srsConfig?.optIn === false) ||
          srsConfigStatus === RequestStatusType.ERROR ||
          srsConfigStatus === RequestStatusType.EMPTY),
    );
  }, [srsConfig, srsConfigStatus, isSRSEnabled, isOnboardingContentEnabled, showOnboardingContent, announcements]);

  return { showOnboardingContent, showSRSBanner, showAnnouncements, announcements };
};

export { useHandleSRSDisplay };
