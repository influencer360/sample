import React, { useCallback, memo } from 'react';
import styled from 'styled-components';
import { emit } from 'fe-lib-hootbus';
import { getThemeValue, withHsTheme } from 'fe-lib-theme';
import { track } from 'fe-lib-tracking';
import { Profile, SocialProfileState } from 'fe-pnc-data-social-profiles-v2';
import ProfileIcon from 'assets/ProfileIcon';
import { OPEN_COMPOSER } from 'constants/hootbus-actions';
import {
  TRACKING_EVENT_USER_CLICK_CONNECTED_ACCOUNT_LIST_ITEM,
  TRACKING_ORIGIN_CURRENT_ACCOUNTS_CONNECTED,
} from 'constants/tracking';
import { useElementSize } from 'hooks/useElementSize';
import {
  sortSocialProfiles,
  getFavoriteProfileIds,
  getSuggestedProfileIds,
  getDisconnectedProfileIds,
} from 'utils/socialProfiles';
import ConnectedAccount from './ConnectedAccount';
import type { TabKeys } from './ConnectedAccounts';

const SocialProfileList = styled.div<{ cols: number }>`
  position: relative;
  display: grid;
  grid-template-columns: repeat(${p => p.cols}, 1fr);
  grid-template-rows: repeat(52px);
  row-gap: 10px;
  column-gap: 16px;
  max-height: 400px;
  overflow: hidden;
`;

const ListItemContainer = withHsTheme(styled.div<{ cols: number }>`
  display: flex;
  justify-content: flex-start;
  width: 100%;

  & > button {
    width: 100%;
    margin-left: -4px;

    & > div {
      white-space: normal;
    }
  }

  & > button > div > p {
    color: ${() => getThemeValue(t => t.colors.menuItem.text)};
    word-break: break-all;
    text-align: left;
    line-height: 1;
    font-size: 16px;
    font-weight: 600;
  }
`);

const MoreProfilesContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  margin-right: 4px;
  width: 200px;
  border: none;
  padding: 6px;
`;

const MoreProfilesLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #1c1c1c;
  white-space: nowrap;
`;

const getSortedProfiles = (socialProfileState: SocialProfileState): Profile[] => {
  const disconnectedProfileIds = getDisconnectedProfileIds(socialProfileState.expired);
  const favoriteProfileIds = getFavoriteProfileIds(socialProfileState.favorites);
  const suggestedProfileIds = getSuggestedProfileIds(socialProfileState.suggested);
  return sortSocialProfiles(
    socialProfileState.allProfiles,
    disconnectedProfileIds,
    favoriteProfileIds,
    suggestedProfileIds,
  );
};

const StyledProfileContainer = styled.div`
  padding: 2px 12px;
`;

const MemoizedConnectedAccount = memo(ConnectedAccount);

type ConnectedAccountsListProps = {
  socialProfiles: SocialProfileState;
  activeTab: TabKeys;
};

type ConnectedAccountListItemProps = {
  profile: Profile;
  cols: number;
};

const ConnectedAccountListItem = ({ profile, cols }: ConnectedAccountListItemProps): JSX.Element => {
  const handleClick = useCallback(() => {
    emit(OPEN_COMPOSER, { socialNetworkId: profile.socialProfileId });
    track(TRACKING_ORIGIN_CURRENT_ACCOUNTS_CONNECTED, TRACKING_EVENT_USER_CLICK_CONNECTED_ACCOUNT_LIST_ITEM);
  }, [profile.socialProfileId]);

  return (
    <ListItemContainer cols={cols}>
      <MemoizedConnectedAccount
        imageUrl={profile.avatar}
        isDisconnected={profile.isReauthRequired}
        handleOnClick={handleClick}
        socialNetworkType={profile.socialProfileType}
        username={profile.username}
        flexDirection="row"
        socialProfileId={profile.socialProfileId}
      />
    </ListItemContainer>
  );
};

const ConnectedAccountsList: React.FunctionComponent<ConnectedAccountsListProps> = ({
  socialProfiles,
  activeTab,
}): JSX.Element => {
  const maxNumberOfAccounts = 5;
  const minColumnWidth = 260;
  const sortedProfiles = getSortedProfiles(socialProfiles);
  const { ref, width, height } = useElementSize();
  const cols = Math.max(Math.floor(width / minColumnWidth), 1);
  const slicedProfiles = sortedProfiles.slice(0, maxNumberOfAccounts);

  return (
    <SocialProfileList id={activeTab} role="tabpanel" aria-labelledby={activeTab} ref={ref} cols={cols}>
      {slicedProfiles.map((profile, index, { length }) => (
        <div key={profile.socialProfileId + index}>
          <ConnectedAccountListItem profile={profile} cols={cols} />
          {length - 1 === index && sortedProfiles.length > maxNumberOfAccounts && (
            <MoreProfilesContainer>
              <StyledProfileContainer>
                <ProfileIcon />
              </StyledProfileContainer>
              <MoreProfilesLabel>
                {'+' + `${sortedProfiles.length - maxNumberOfAccounts}` + ' more accounts'}
              </MoreProfilesLabel>
            </MoreProfilesContainer>
          )}
        </div>
      ))}
    </SocialProfileList>
  );
};

export default ConnectedAccountsList;
