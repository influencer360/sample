import { useEffect, useState } from 'react';
import { GoalStatusData } from 'fe-social-value-lib-core';
import { fetchGoals } from 'services/goals';
import { RequestStatusType } from 'typings/Shared';

const useGoals = (callGoalsService: boolean) => {
  const [goals, setGoals] = useState<GoalStatusData[]>([]);
  const [goalsStatus, setGoalsStatus] = useState(RequestStatusType.LOADING);

  useEffect(() => {
    if (callGoalsService) {
      setGoalsStatus(RequestStatusType.LOADING);
      const orgId = window.hs.organizations && window.hs.organizations.length > 0 && window.hs.organizations[0].id;

      if (orgId) {
        fetchGoals(orgId)
          .then(goals => {
            setGoalsStatus(RequestStatusType.SUCCESS);
            setGoals(goals);
          })
          .catch(() => {
            setGoalsStatus(RequestStatusType.ERROR);
          });
      } else {
        setGoalsStatus(RequestStatusType.EMPTY);
        setGoals([]);
      }
    } else {
      setGoalsStatus(RequestStatusType.EMPTY);
      setGoals([]);
    }
  }, [callGoalsService]);

  return { goalsStatus, goals };
};

export { useGoals };
