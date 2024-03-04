import { useEffect, useState } from 'react';
import { track } from 'fe-lib-tracking';
import {
  TRACKING_EVENT_USER_CLICKS_DISMISS_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST,
  TRACKING_EVENT_USER_CLICKS_OPT_IN_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST,
  TRACKING_ORIGIN_SRS_BANNER,
} from 'constants/tracking';
import { fetchSRSConfig, postSRSConfig } from 'services/socialRelationshipScore';
import { RequestStatusType } from 'typings/Shared';
import { SRSConfigResponse } from 'typings/SocialRelationshipScore';
import darklaunch from 'utils/darklaunch';

const useSRSConfig = () => {
  const [srsConfig, setSRSConfig] = useState<SRSConfigResponse>();
  const [srsConfigStatus, setSRSConfigStatus] = useState(RequestStatusType.LOADING);

  const isSRSEnabled = !!darklaunch.isFeatureEnabled('SRS_67_SRS_INTENT_TEST_ACCESS');

  useEffect(() => {
    if (isSRSEnabled) {
      setSRSConfigStatus(RequestStatusType.LOADING);
      fetchSRSConfig()
        .then(srsConfigData => {
          setSRSConfig(srsConfigData);
          setSRSConfigStatus(RequestStatusType.SUCCESS);
        })
        .catch(() => {
          setSRSConfigStatus(RequestStatusType.ERROR);
        });
    } else {
      setSRSConfig(undefined);
      setSRSConfigStatus(RequestStatusType.EMPTY);
    }
  }, [isSRSEnabled]);

  function handleOpt(value: boolean) {
    if (value === undefined || !isSRSEnabled) {
      return;
    }

    const newSRSConfig = { ...srsConfig, optIn: value };

    postSRSConfig(newSRSConfig).then(srsConfigData => {
      setSRSConfig(srsConfigData);
      if (value) {
        track(TRACKING_ORIGIN_SRS_BANNER, TRACKING_EVENT_USER_CLICKS_OPT_IN_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST);
      } else {
        track(TRACKING_ORIGIN_SRS_BANNER, TRACKING_EVENT_USER_CLICKS_DISMISS_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST);
      }
    });
  }

  return { srsConfigStatus, srsConfig, handleOpt };
};

export { useSRSConfig };
