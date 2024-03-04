import React, { useState } from 'react';
import styled from 'styled-components';
import Icon from '@fp-icons/icon-base';
import AlertTriangle from '@fp-icons/symbol-alert-triangle';
import { Avatar } from 'fe-comp-avatar';
import { withI18n } from 'fe-lib-i18n';
import { withHsTheme, getThemeValue } from 'fe-lib-theme';
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles';
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles';
import { Button, TEXT, SIZE_24 } from 'components/Button';
import ReauthModal from 'components/ReauthModal';

const IMAGE_FALLBACK = 'https://assets.hootsuite.com/v2/images/dashboard/avatars/member-default-100.8e9a4075.png';

const getNetworkIcons = (key: string) => {
  return SocialProfileConstants.FILLED_GLYPHS_BY_SN_TYPE[key];
};

const StyledAvatar = withHsTheme(styled(Avatar)<{ isDisconnected: boolean }>`
  border: 2px solid;
  border-color: transparent;
  border-radius: 50%;
  padding: 0 !important; //Required to override Avatar padding that breaks disconnected styles
  margin: 0 12px;
`);

const Wrapper = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  border: 3px solid transparent;
  width: 100%;

  &:focus-visible {
    box-shadow: none;
    border: 3px solid ${() => getThemeValue(t => t.colors.focusBorder as string)};
  }
`);

const AccountLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  overflow: hidden;
  width: inherit;
`;

const AccountName = withHsTheme(styled.p`
  color: ${() => getThemeValue(t => t.colors.menuItem.text)};
  word-break: break-all;
  text-align: left;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
`);

const StyledIcon = styled(Icon)`
  min-width: 16px;
`;

const AccountNameWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const DisconnectedContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  && > button {
    padding: 0 8px;
  }
`;
const DisconnectedLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  color: #8c621c;
  padding: 2px 8px;
  justify-content: center;
  gap: 4px;
  border-radius: 2px;
  background: #fff7eb;
`;

const DisconnectedLabel = styled.p`
  display: flex;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
`;

const ReconnectButton = styled(Button)`
  text-wrap: wrap;
  height: auto;
  font-size: 14px;
`;

export type ConnectedAccountProps = {
  socialNetworkType: SocialNetworkType;
  username: string;
  imageUrl?: string;
  isDisconnected: boolean;
  handleOnClick: () => void;
  socialProfileId: number;
  flexDirection?: 'row' | 'column';
  size?: string;
  $i18n: {
    reconnect: () => string;
    disconnected: () => string;
  };
};

const ConnectedAccount = ({
  socialNetworkType,
  username,
  imageUrl,
  isDisconnected,
  size,
  socialProfileId,
  $i18n,
}: ConnectedAccountProps): JSX.Element => {
  const [isReauthModalVisible, setisReauthModalVisible] = useState(false);

  const handleReconnect = () => {
    setisReauthModalVisible(true);
  };

  const handleModalClose = () => {
    setisReauthModalVisible(false);
  };

  return (
    <Wrapper>
      <div>
        <StyledAvatar
          size={size ? size : '48px'}
          src={imageUrl ? imageUrl : IMAGE_FALLBACK}
          isDisconnected={isDisconnected}
          badge={
            getNetworkIcons(socialNetworkType) ? (
              <Icon size="20px" title={socialNetworkType + ' Icon'} glyph={getNetworkIcons(socialNetworkType)} />
            ) : null
          }
        />
      </div>
      <AccountLabel>
        <AccountNameWrapper>
          <AccountName>{username}</AccountName>
          {isDisconnected && (
            <DisconnectedContainer>
              <DisconnectedLabelWrapper>
                <StyledIcon fill="#8C621C" glyph={AlertTriangle} title="Disconnected account icon" />
                <DisconnectedLabel>{$i18n.disconnected()}</DisconnectedLabel>
              </DisconnectedLabelWrapper>
              <ReconnectButton type={TEXT} height={SIZE_24} onClick={handleReconnect}>
                {$i18n.reconnect()}
              </ReconnectButton>
            </DisconnectedContainer>
          )}
        </AccountNameWrapper>
      </AccountLabel>

      {isReauthModalVisible && (
        <div data-testid="social-profiles-dialog-reauth">
          <ReauthModal close={handleModalClose} context={[socialProfileId]} />
        </div>
      )}
    </Wrapper>
  );
};

export default withI18n({
  reconnect: 'Reconnect',
  disconnected: 'Disconnected',
})(ConnectedAccount);
