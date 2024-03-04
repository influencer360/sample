import { useEffect, useState } from 'react';
import { TrendingWord } from 'fe-social-value-comp-trend-card';
import { fetchTopWords } from 'services/trendWords';
import { RequestStatusType } from 'typings/Shared';

const useWords = (callWordsService: boolean, trendIds: string[], count: string) => {
  const [words, setWords] = useState<Array<TrendingWord[]>>([]);
  const [status, setStatus] = useState(RequestStatusType.LOADING);

  useEffect(() => {
    if (callWordsService) {
      setStatus(RequestStatusType.LOADING);
      const promisesWords: Promise<TrendingWord[]>[] = [];
      trendIds.forEach((trendId: string) => {
        promisesWords.push(fetchTopWords(trendId, count));
      });

      Promise.all(promisesWords).then((data: TrendingWord[][]) => {
        setWords(data);
      });
    } else {
      setStatus(RequestStatusType.EMPTY);
      setWords([]);
    }
  }, [callWordsService, count, trendIds]);

  return { status, words };
};

export { useWords };
