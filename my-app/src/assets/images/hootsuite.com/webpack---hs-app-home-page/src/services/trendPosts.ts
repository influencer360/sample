import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { Post } from 'fe-social-value-comp-trend-card';
import { DOMAIN, getTrendingDocumentsUrl } from 'constants/api';
import {
  TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS_POST,
  TRACKING_EVENT_USER_FETCHED_TRENDS_POST,
  TRACKING_ORIGIN_TRENDS,
} from 'constants/tracking';
import { TrendingDocument } from 'typings/Trends';

export const fetchPosts = async (trendId: string, count: string): Promise<Array<Post>> => {
  const params: URLSearchParams = new URLSearchParams({
    limit: count,
    trendingDocumentType: 'POST',
  });
  const response = await apertureApiRequest(DOMAIN, getTrendingDocumentsUrl(trendId, params));

  if (!response.ok) {
    track(TRACKING_ORIGIN_TRENDS, TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS_POST, { statusCode: response.status });
    throw new Error(response.statusText);
  }

  const { trendingDocuments } = await response.json();
  const trendPosts = trendingDocuments as TrendingDocument[];

  const mappedPosts = mapToPosts(trendPosts);

  track(TRACKING_ORIGIN_TRENDS, TRACKING_EVENT_USER_FETCHED_TRENDS_POST);

  return mappedPosts;
};

function mapToPosts(docs: TrendingDocument[]): Post[] {
  const uniqueDocs = docs.reduce((acc, curr) => {
    if (!acc.find(x => x.trendingDocumentId === curr.trendingDocumentId)) {
      acc.push(curr);
    }
    return acc;
  }, [] as TrendingDocument[]);

  const getPictureFromMedia = (doc: TrendingDocument): string =>
    doc?.trendingDocumentData?.content?.medias?.find(media => media.mimeType.includes('image'))?.url ?? '';

  return uniqueDocs.map(doc => ({
    socialNetwork: doc.trendingDocumentData.source.platform,
    trendBody: doc.trendingDocumentData.content.body,
    imgUrl: getPictureFromMedia(doc),
    imgAlt: 'Trend alt text',
    trendId: doc.trendingDocumentId,
  }));
}
