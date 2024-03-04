import { useEffect, useState } from 'react';
import { fetchTrends } from 'services/trends';
import { RequestStatusType } from 'typings/Shared';
import { Trend } from 'typings/Trends';

const useTrends = (callTrendsService: boolean, count: string) => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendIds, setTrendIds] = useState<string[]>([]);
  const [status, setStatus] = useState(RequestStatusType.LOADING);

  useEffect(() => {
    if (callTrendsService) {
      setStatus(RequestStatusType.LOADING);
      fetchTrends(count)
        .then((trends: Trend[]) => {
          const trendIds: string[] = trends.map((trend: Trend) => trend.id);
          setStatus(RequestStatusType.SUCCESS);
          setTrendIds(trendIds);
          setTrends(trends);
        })
        .catch(() => {
          setStatus(RequestStatusType.ERROR);
        });
    } else {
      setStatus(RequestStatusType.EMPTY);
      setTrends([]);
    }
  }, [callTrendsService, count]);

  return { status, trends, trendIds };
};

export { useTrends };
