import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { TrendingTopic } from 'fe-social-value-lib-core';
import { DOMAIN, getTrendingTopicsUrl } from 'constants/api';
import {
  TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS,
  TRACKING_EVENT_USER_FETCHED_TRENDS,
  TRACKING_ORIGIN_TRENDS,
} from 'constants/tracking';
import { Trend } from 'typings/Trends';

export const fetchTrends = async (count: string): Promise<Array<Trend>> => {
  const params: URLSearchParams = new URLSearchParams({
    limit: count,
  });
  const response = await apertureApiRequest(DOMAIN, getTrendingTopicsUrl(params));

  if (!response.ok) {
    track(TRACKING_ORIGIN_TRENDS, TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS, { statusCode: response.status });
    throw new Error(response.statusText);
  }

  const { trendingTopics } = await response.json();
  const trends = trendingTopics as TrendingTopic[];
  const mappedTrends = mapToTrends(trends);

  track(TRACKING_ORIGIN_TRENDS, TRACKING_EVENT_USER_FETCHED_TRENDS);

  return mappedTrends;
};

function mapToTrends(trendsResponse: TrendingTopic[] | undefined): Trend[] {
  if (!trendsResponse) {
    return [];
  }

  const uniqueTrends = trendsResponse.reduce((acc, curr) => {
    if (!acc.find(x => x.trendingTopicId === curr.trendingTopicId)) {
      acc.push(curr);
    }
    return acc;
  }, [] as TrendingTopic[]);

  return uniqueTrends.map(res => ({
    id: res.trendingTopicId ?? '',
    title: res.title ?? 'Title',
    description: res.description ?? 'Description',
  }));
}
