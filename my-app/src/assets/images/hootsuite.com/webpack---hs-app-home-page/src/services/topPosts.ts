import { getUnixTime } from 'date-fns';
import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { DOMAIN, SOCIAL_SCORE_GET_TOP_POST_URL } from 'constants/api';
import {
  TRACKING_EVENT_USER_FAILED_TO_FETCH_TOP_POSTS,
  TRACKING_EVENT_USER_FETCH_TOP_POSTS,
  TRACKING_ORIGIN_TOP_POSTS,
} from 'constants/tracking';
import { TopPost, TopPostsResponse } from 'typings/TopPosts';

export const fetchTopPerformingPosts = async (date: Date, numberOfPosts: number): Promise<Array<TopPost>> => {
  const response = await apertureApiRequest(
    DOMAIN,
    SOCIAL_SCORE_GET_TOP_POST_URL + `?date=${getUnixTime(date)}&count=${numberOfPosts}`,
  );

  if (!response.ok) {
    track(TRACKING_ORIGIN_TOP_POSTS, TRACKING_EVENT_USER_FAILED_TO_FETCH_TOP_POSTS, { statusCode: response.status });
    throw new Error(response.statusText);
  }

  const { posts } = (await response.json()) as TopPostsResponse;

  if (!posts) {
    track(TRACKING_ORIGIN_TOP_POSTS, TRACKING_EVENT_USER_FAILED_TO_FETCH_TOP_POSTS, { statusCode: response.status });
    throw new Error('Unexpected service response for top post');
  }

  track(TRACKING_ORIGIN_TOP_POSTS, TRACKING_EVENT_USER_FETCH_TOP_POSTS);

  return posts;
};
