import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { DOMAIN, getSRSConfigUrl, getSRSUrl } from 'constants/api';
import {
  TRACKING_ORIGIN_SRS,
  TRACKING_EVENT_USER_FAILED_TO_FETCH_SRS,
  TRACKING_EVENT_USER_FETCHED_SRS,
  TRACKING_EVENT_USER_FAILED_TO_FETCH_SRS_CONFIG,
  TRACKING_EVENT_USER_FETCHED_SRS_CONFIG,
  TRACKING_EVENT_USER_FAILED_TO_POST_SRS_CONFIG,
  TRACKING_EVENT_USER_POSTED_SRS_CONFIG,
} from 'constants/tracking';
import { MemberSRSResponse, SRSConfig, SRSConfigResponse } from 'typings/SocialRelationshipScore';

export const fetchSRScore = async (): Promise<MemberSRSResponse> => {
  const response = await apertureApiRequest(DOMAIN, getSRSUrl());

  if (!response?.ok) {
    track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_FAILED_TO_FETCH_SRS, {
      statusCode: response.status,
    });
    throw new Error(response.statusText);
  }

  const data = await response.json();
  const srs = data as MemberSRSResponse;

  track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_FETCHED_SRS);
  return srs;
};

export const fetchSRSConfig = async (): Promise<SRSConfigResponse> => {
  const response = await apertureApiRequest(DOMAIN, getSRSConfigUrl());

  if (!response?.ok) {
    if (response?.status === 404) {
      track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_FETCHED_SRS_CONFIG, {
        statusCode: response?.status,
      });
      return null as SRSConfigResponse;
    }

    track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_FAILED_TO_FETCH_SRS_CONFIG, {
      statusCode: response?.status,
    });
    throw new Error(response?.statusText);
  }

  const data = await response.json();
  const srsConfig = data as SRSConfigResponse;

  track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_FETCHED_SRS_CONFIG);
  return srsConfig;
};

export const postSRSConfig = async (newSRSConfig: SRSConfig): Promise<SRSConfigResponse> => {
  const options = {
    method: 'POST',
    body: JSON.stringify(newSRSConfig),
  } as RequestInit;
  const response = await apertureApiRequest(DOMAIN, getSRSConfigUrl(), options);

  if (!response?.ok) {
    track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_FAILED_TO_POST_SRS_CONFIG, {
      statusCode: response?.status,
    });
    return null as SRSConfigResponse;
  }

  const data = await response.json();
  const srsConfig = data as SRSConfigResponse;

  track(TRACKING_ORIGIN_SRS, TRACKING_EVENT_USER_POSTED_SRS_CONFIG);
  return srsConfig;
};
