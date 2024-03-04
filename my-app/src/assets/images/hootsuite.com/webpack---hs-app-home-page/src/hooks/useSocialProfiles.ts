import { useState, useEffect } from 'react';
import { track } from 'fe-lib-tracking';
import { subscribe, getState, getSocialProfilesAndPopulateStore } from 'fe-pnc-data-social-profiles-v2';
import type { SocialProfileState } from 'fe-pnc-data-social-profiles-v2';
import { SOCIAL_PROFILES_STATE_LOCAL_STORAGE_KEY } from 'constants/localStorage';
import {
  TRACKING_ORIGIN_CURRENT_ACCOUNTS_CONNECTED,
  TRACKING_EVENT_USER_FETCHED_SOCIAL_ACCOUNTS,
  TRACKING_EVENT_USER_FAILED_TO_FETCH_SOCIAL_ACCOUNTS,
} from 'constants/tracking';
import useLocalStorage from './useLocalStorage';

type useSocialProfileProps = {
  socialProfiles: SocialProfileState;
  hasError: boolean;
  isLoading: boolean;
};

const useSocialProfiles = (): useSocialProfileProps => {
  const [socialProfiles, setSocialProfiles] = useState<SocialProfileState>(getState());
  const [cachedSocialProfilesState, setCachedSocialProfilesState] = useLocalStorage<SocialProfileState>(
    SOCIAL_PROFILES_STATE_LOCAL_STORAGE_KEY,
    socialProfiles,
  );
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      const socialProfilesState = getState();

      setSocialProfiles(socialProfilesState);
      setCachedSocialProfilesState(socialProfilesState);
    });

    getSocialProfilesAndPopulateStore()
      .then(() => {
        setHasError(false);
        track(TRACKING_ORIGIN_CURRENT_ACCOUNTS_CONNECTED, TRACKING_EVENT_USER_FETCHED_SOCIAL_ACCOUNTS);
      })
      .catch(() => {
        track(TRACKING_ORIGIN_CURRENT_ACCOUNTS_CONNECTED, TRACKING_EVENT_USER_FAILED_TO_FETCH_SOCIAL_ACCOUNTS);
        if (cachedSocialProfilesState) {
          setHasError(false);
          setSocialProfiles(cachedSocialProfilesState);
        } else {
          setHasError(true);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return unsubscribe;
  }, []);

  return { socialProfiles, hasError, isLoading };
};

export default useSocialProfiles;
