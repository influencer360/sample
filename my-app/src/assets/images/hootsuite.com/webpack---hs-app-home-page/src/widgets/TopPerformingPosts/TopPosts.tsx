import React from 'react';
import styled from 'styled-components';
import { track } from 'fe-lib-tracking';
import SocialPost from 'components/SocialPost/SocialPost';
import { TRACKING_EVENT_USER_CLICKS_POST_EXTERNAL_LINK, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import { TopPost, PostComponentProps } from 'typings/TopPosts';
import { WidgetName } from 'typings/Widget';
import ErrorTopPerformingPosts from './Empty';

const TopPerformingPostsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

type TopPostsProps = {
  posts: TopPost[];
};

const postToTopPostProps = (post: TopPost): PostComponentProps => {
  return {
    socialNetworkType: post.source.social_network_type,
    username: post.source.name,
    engagement: post.engagement,
    image: post.thumbnail_url,
    text: post.body,
  };
};

const TopPosts = ({ posts }: TopPostsProps) => {
  const onExternalLinkClick = (data: JSON) => {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_POST_EXTERNAL_LINK, {
      widgetName: WidgetName.TOP_PERFORMING_POSTS,
      data: data,
    });
  };

  return (
    <TopPerformingPostsWrapper>
      {posts.length === 0 && <ErrorTopPerformingPosts />}
      {posts.map(post => {
        const images = post.thumbnail_url === '' ? [] : [post.thumbnail_url];
        return (
          <SocialPost
            key={post.id}
            creationDate={`${post.created_at}`}
            username={post.source.name}
            socialNetworkTypes={[post.source.social_network_type]}
            engagement={post.engagement}
            additionalData={new Date(Number(post.created_at) * 1000).toDateString()}
            images={images}
            text={post.body}
            onExternalUrlClick={() => onExternalLinkClick(JSON.parse(JSON.stringify(post)))}
          />
        );
      })}
    </TopPerformingPostsWrapper>
  );
};

export default TopPosts;
