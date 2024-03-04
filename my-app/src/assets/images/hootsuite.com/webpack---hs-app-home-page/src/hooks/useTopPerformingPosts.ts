import { useEffect, useState } from 'react';
import { TOP_PERFORMING_POSTS_LOCAL_STORAGE_KEY } from 'constants/localStorage';
import { fetchTopPerformingPosts } from 'services/topPosts';
import { RequestStatusType } from 'typings/Shared';
import { TopPost } from 'typings/TopPosts';
import useLocalStorage from './useLocalStorage';

type UseTopPerformingPosts = {
  status: RequestStatusType;
  posts: TopPost[];
};

const useTopPerformingPosts = (numberOfPosts: number): UseTopPerformingPosts => {
  const [posts, setPosts] = useState<TopPost[]>([]);
  const [status, setStatus] = useState(RequestStatusType.LOADING);
  const [cachedPosts, setCachedPosts] = useLocalStorage<TopPost[]>(TOP_PERFORMING_POSTS_LOCAL_STORAGE_KEY, []);

  useEffect(() => {
    const currentTime = new Date();

    setStatus(RequestStatusType.LOADING);

    fetchTopPerformingPosts(currentTime, numberOfPosts)
      .then(posts => {
        if (posts && posts.length > 0) {
          setPosts(posts);
          setCachedPosts(posts);
          setStatus(RequestStatusType.SUCCESS);
        } else {
          setPosts([]);
          setCachedPosts([]);
          setStatus(RequestStatusType.EMPTY);
        }
      })
      .catch(() => {
        if (cachedPosts.length > 0) {
          setPosts(cachedPosts);
          setStatus(RequestStatusType.SUCCESS);
        } else {
          setPosts([]);
          setStatus(RequestStatusType.EMPTY);
        }
      });
  }, []);

  return { status, posts };
};

export default useTopPerformingPosts;
