import { apertureApiRequest } from 'fe-comp-aperture';
import { track } from 'fe-lib-tracking';
import { TrendingWord } from 'fe-social-value-comp-trend-card';
import { DOMAIN, getTrendingDocumentsUrl } from 'constants/api';
import {
  TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS_TOP_WORDS,
  TRACKING_EVENT_USER_FETCHED_TRENDS_TOP_WORDS,
  TRACKING_ORIGIN_TRENDS,
} from 'constants/tracking';
import { TrendingDocument } from 'typings/Trends';

export const fetchTopWords = async (trendId: string, count: string): Promise<Array<TrendingWord>> => {
  const params: URLSearchParams = new URLSearchParams({
    limit: count,
    trendingDocumentType: 'HASHTAG',
  });
  const response = await apertureApiRequest(DOMAIN, getTrendingDocumentsUrl(trendId, params));

  if (!response.ok) {
    track(TRACKING_ORIGIN_TRENDS, TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS_TOP_WORDS, {
      statusCode: response.status,
    });
    throw new Error(response.statusText);
  }

  const { trendingDocuments } = await response.json();
  const trendTopWordsHashtags = trendingDocuments as TrendingDocument[];

  const mappedTopWords = mapToWords(trendTopWordsHashtags);

  track(TRACKING_ORIGIN_TRENDS, TRACKING_EVENT_USER_FETCHED_TRENDS_TOP_WORDS);

  return mappedTopWords;
};

const mapToWords = (res: TrendingDocument[]): TrendingWord[] => {
  const uniqueWords = res?.reduce((acc, curr) => {
    if (!acc.find(x => x.trendingDocumentId === curr.trendingDocumentId)) {
      acc.push(curr);
    }
    return acc;
  }, [] as TrendingDocument[]);

  const words: TrendingWord[] = uniqueWords.map((document: TrendingDocument) => {
    return { id: document.trendingDocumentId, word: document.trendingDocumentData?.content?.body || '' };
  });

  return words;
};
