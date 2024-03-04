import { ComponentProps } from 'react';
import { apertureApiRequest } from 'fe-comp-aperture';
import { RecommendationTile } from 'fe-social-value-comp-recommendation-tile';
import { TRENDS_FACADE_URL, ApiErrors, ApiErrorsDto } from 'fe-social-value-lib-core';
import { CallToActionType, GetRecommendationsResponse, RecommendationResponse } from '../typings/recommendations';

export const RECOMMENDATIONS_API_ROUTE = '/service/social-value/v1/recommendations';

export const CLIENT_AUTH_ERROR = 'Missing client authentication';
export const GENERIC_ERROR = 'Something wrong happened during the request.';

export function fetchRecommendations(
  orgId: string,
  goalId: string,
  limit: number,
): Promise<ComponentProps<typeof RecommendationTile>[]> {
  const params: URLSearchParams = new URLSearchParams({
    limit: limit.toString(),
    orgId,
    goalId,
  });

  return apertureApiRequest(TRENDS_FACADE_URL, `${RECOMMENDATIONS_API_ROUTE}?${params}`)
    .then((response: Response) => {
      if (response.status === 401) {
        return Promise.reject(new Error(CLIENT_AUTH_ERROR));
      }

      return response.json();
    })
    .then((responseData: GetRecommendationsResponse | ApiErrorsDto) => {
      if ('errors' in responseData) {
        const apiErrors = new ApiErrors(responseData);
        throw new Error(apiErrors.toString());
      } else if ('recommendations' in responseData) {
        return mapRecommendationsToTileProps(responseData.recommendations);
      }

      throw new Error(GENERIC_ERROR);
    });
}

export function mapRecommendationsToTileProps(
  recommendations: RecommendationResponse[] | undefined,
): ComponentProps<typeof RecommendationTile>[] {
  if (!recommendations) {
    return [];
  }

  return recommendations.map(recommendation => {
    const text = `${recommendation.insight} ${recommendation.message}`;
    if (recommendation.callToAction.type === CallToActionType.Link) {
      return {
        text,
        ctaBtnText: recommendation.callToAction.callToActionLink?.linkText ?? '',
        ctaLink: recommendation.callToAction.callToActionLink?.linkUrl,
        askForFeedback: recommendation.askForFeedback,
        definitionId: recommendation.definitionId,
      };
    }
    return {
      text,
      ctaBtnText: recommendation.callToAction.callToActionEmit?.emitText ?? '',
      ctaEmitAction: recommendation.callToAction.callToActionEmit?.emitAction,
      askForFeedback: recommendation.askForFeedback,
      definitionId: recommendation.definitionId,
    };
  });
}
