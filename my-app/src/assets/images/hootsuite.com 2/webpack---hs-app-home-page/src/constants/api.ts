import { env, DEV, STAGING, PRODUCTION } from 'fe-lib-env';

const domains = {
  [DEV]: 'development-api-services.hootsuite.com',
  [STAGING]: 'staging-api-services.hootsuite.com',
  [PRODUCTION]: 'api-services.hootsuite.com',
};

export const DOMAIN = domains[env()];

const measureDomains = {
  dev: 'staging-measure.hootsuite.com',
  staging: 'staging-measure.hootsuite.com',
  production: 'measure.hootsuite.com',
};

export const MEASURE_DOMAIN = measureDomains[env()];

// Endpoint URL(s)
export const SOCIAL_SCORE_GET_TOP_POST_URL = '/service/social-score/top-posts';
export const SOCIAL_SCORE_GET_SOCIAL_SCORE = '/service/social-score/social-score';
export const SOCIAL_SCORE_GET_TOTALS = '/service/social-score/totals';

const SOCIAL_VALUE_API = '/service/social-value/v1';
export const getGoalsTrackingStatusUrl = (orgId: number) => `${SOCIAL_VALUE_API}/organizations/${orgId}/goals/status`;
export const getTrendingTopicsUrl = (params: URLSearchParams) => `${SOCIAL_VALUE_API}/trendingTopics?${params}`;
export const getTrendingDocumentsUrl = (trendId: string, params: URLSearchParams) =>
  `${SOCIAL_VALUE_API}/trendingTopics/${trendId}/trendingDocuments?${params}`;

const SOCIAL_RELATIONSHIP_SCORE_API = '/service/social-relationship-score/v1/srs';
export const getSRSUrl = () => `${SOCIAL_RELATIONSHIP_SCORE_API}`;
export const getSRSConfigUrl = () => `${SOCIAL_RELATIONSHIP_SCORE_API}/config`;
