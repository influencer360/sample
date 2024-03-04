import { ComponentProps, useEffect, useState } from 'react';
import { RecommendationTile } from 'fe-social-value-comp-recommendation-tile';
import { RequestStatusType } from 'typings/Shared';
import { fetchRecommendations } from '../services/recommendations';
import { useGoals } from './useGoals';

export const DEFAULT_RECOMMENDATIONS_LIMIT = 2;

const useRecommendations = (callRecommendationService: boolean) => {
  const [recommendations, setRecommendations] = useState<ComponentProps<typeof RecommendationTile>[]>([]);
  const [status, setStatus] = useState(RequestStatusType.LOADING);
  const { goals } = useGoals(true);

  useEffect(() => {
    if (callRecommendationService) {
      setStatus(RequestStatusType.LOADING);
      const orgId = window.hs.organizations && window.hs.organizations.length > 0 && window.hs.organizations[0].id;

      if (orgId && goals.length > 0) {
        fetchRecommendations(orgId.toString(), goals[goals.length - 1].goal.goalId, DEFAULT_RECOMMENDATIONS_LIMIT)
          .then(recommendations => {
            setStatus(RequestStatusType.SUCCESS);
            setRecommendations(recommendations);
          })
          .catch(() => {
            setStatus(RequestStatusType.ERROR);
          });
      } else {
        setStatus(RequestStatusType.EMPTY);
        setRecommendations([]);
      }
    } else {
      setStatus(RequestStatusType.EMPTY);
      setRecommendations([]);
    }
  }, [goals, callRecommendationService]);

  return { status, recommendations };
};

export { useRecommendations };
