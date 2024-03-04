import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { DOMAIN } from 'constants/api';
import {
  TRACKING_EVENT_USER_FAILED_TO_FETCH_AVAILABLE_ADDONS,
  TRACKING_EVENT_USER_FAILED_TO_FETCH_MEMBER_ADDONS,
  TRACKING_EVENT_USER_FETCHED_MEMBER_ADDONS,
  TRACKING_EVENT_USER_FETCHED_AVAILABLE_ADDONS,
  TRACKING_ORIGIN_ADDONS,
} from 'constants/tracking';
import { AddOn, MemberAddonsResponse, AvailableAddonsResponse, AccountAddon } from 'typings/addons';

const ADDONS_PATH = '/service/billing/addons';
const ACCOUNTS_PATH = '/service/billing/accounts';
const AVAILABLE_ADDONS = '/availableAddons';

export const fetchMemberAddons = async (memberId: number): Promise<AccountAddon[]> => {
  const URL = `${ACCOUNTS_PATH}/${memberId}/addons`;
  const response = await apertureApiRequest(DOMAIN, URL);

  if (!response.ok) {
    track(TRACKING_ORIGIN_ADDONS, TRACKING_EVENT_USER_FAILED_TO_FETCH_MEMBER_ADDONS, { statusCode: response.status });
    throw new Error(response.statusText);
  }

  const { data } = await response.json();
  const memberAddons = data as MemberAddonsResponse;

  track(TRACKING_ORIGIN_ADDONS, TRACKING_EVENT_USER_FETCHED_MEMBER_ADDONS);
  return memberAddons;
};

export const fetchAvailableAddons = async (memberId: number): Promise<AddOn[]> => {
  const URL = `${ADDONS_PATH}/${memberId + AVAILABLE_ADDONS}`;
  const response = await apertureApiRequest(DOMAIN, URL);

  if (!response.ok) {
    track(TRACKING_ORIGIN_ADDONS, TRACKING_EVENT_USER_FAILED_TO_FETCH_AVAILABLE_ADDONS, {
      statusCode: response.status,
    });
    throw new Error(response.statusText);
  }

  const { data } = await response.json();
  const availableAddOns = data as AvailableAddonsResponse;
  const addonList = availableAddOns.map(item => {
    return item.addonDto;
  });

  track(TRACKING_ORIGIN_ADDONS, TRACKING_EVENT_USER_FETCHED_AVAILABLE_ADDONS);
  return addonList;
};
