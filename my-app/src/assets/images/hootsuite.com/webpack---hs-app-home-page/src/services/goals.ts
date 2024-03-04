import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { GoalStatusData } from 'fe-social-value-lib-core';

import { DOMAIN, getGoalsTrackingStatusUrl } from 'constants/api';
import {
  TRACKING_EVENT_USER_FAILED_TO_FETCH_GOALS,
  TRACKING_EVENT_USER_FETCHED_GOALS,
  TRACKING_ORIGIN_GOALS,
} from 'constants/tracking';

export const fetchGoals = async (orgId: number): Promise<Array<GoalStatusData>> => {
  const response = await apertureApiRequest(DOMAIN, getGoalsTrackingStatusUrl(orgId));

  if (!response.ok) {
    track(TRACKING_ORIGIN_GOALS, TRACKING_EVENT_USER_FAILED_TO_FETCH_GOALS, { statusCode: response.status });
    throw new Error(response.statusText);
  }

  const { status } = await response.json();
  const trackingStatuses = status as GoalStatusData[];

  track(TRACKING_ORIGIN_GOALS, TRACKING_EVENT_USER_FETCHED_GOALS);

  return trackingStatuses;
};
