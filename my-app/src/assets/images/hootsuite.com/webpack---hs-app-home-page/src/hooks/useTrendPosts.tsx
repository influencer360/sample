import { useEffect, useState } from 'react';
import { Post } from 'fe-social-value-comp-trend-card';
import { fetchPosts } from 'services/trendPosts';
import { RequestStatusType } from 'typings/Shared';

const usePosts = (callPostsService: boolean, trendIds: string[], count: string) => {
  const [posts, setPosts] = useState<Array<Post[]>>([]);
  const [status, setStatus] = useState(RequestStatusType.LOADING);

  useEffect(() => {
    if (callPostsService) {
      setStatus(RequestStatusType.LOADING);
      const promisesPosts: Promise<Post[]>[] = [];
      trendIds.forEach((trendId: string) => {
        promisesPosts.push(fetchPosts(trendId, count));
      });

      Promise.all(promisesPosts).then((data: Post[][]) => {
        setPosts(data);
      });
    } else {
      setStatus(RequestStatusType.EMPTY);
      setPosts([]);
    }
  }, [callPostsService, count, trendIds]);

  return { status, posts };
};

export { usePosts };
