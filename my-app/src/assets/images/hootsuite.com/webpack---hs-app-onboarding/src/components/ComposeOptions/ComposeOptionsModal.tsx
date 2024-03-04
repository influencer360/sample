import React from 'react';
import styled from 'styled-components';
import BoxArrowTopRightOutline from '@fp-icons/box-arrow-top-right-outline';
import Pencil from '@fp-icons/emblem-pencil';
import Icon from '@fp-icons/icon-base';
import { A11yDialog } from 'fe-chan-comp-a11y-dialog';
import { Dialog, Header, Content, Icons, Footer } from 'fe-comp-dialog';
import { Lightbox, PADDING_MINIMAL } from 'fe-comp-lightbox';
import { emit } from 'fe-lib-hootbus';
import { useWithI18n } from 'fe-lib-i18n';
import { getThemeValue, withHsTheme } from 'fe-lib-theme';
import { track } from 'fe-lib-tracking';
import { OwlyWriterAIGraphic } from '../../assets/OwlyWriterAIGraphic';
import {
  TRACKING_EVENT_CLICKED_COMPOSER,
  TRACKING_EVENT_CLICKED_OWLYWRITER,
  TRACKING_ORIGIN_COMPOSE_OPTIONS,
} from '../../constants/tracking';
import OptionCardButton from './OptionCardButton';

const HELP_LINK = 'https://help.hootsuite.com/hc/en-us/articles/14530152011291';

const StyledA11yDialog = styled(A11yDialog)`
  width: 100%;
  height: 100%;
`;

const StyledDialog = styled(Dialog)<{ children?: React.ReactNode }>`
  && {
    min-width: 100%;
    min-height: 100%;
    justify-content: space-between;
    background-color: ${getThemeValue(t => t.colors.lightGrey10)};
  }
`;

const StyledTitle = styled.h1`
  font-size: 36px;
  font-weight: 900;
`;

const StyledHeader = styled(Header)<{ children?: React.ReactNode }>`
  padding-top: 48px;
  padding-bottom: 48px;

  > div {
    max-width: none;
  }
`;

const StyledFooter = styled(Footer)<{ children?: React.ReactNode }>`
  && {
    flex: none;
  }
`;

const ComposeOptions = styled.ul`
  display: flex;
  gap: 48px;
  padding: 20px;
  justify-content: center;
  margin-bottom: 0;
`;

const OptionCard = styled.li`
  min-width: 190px;
  max-width: 330px;
`;

const StyledOwlyWriterGraphic = styled(OwlyWriterAIGraphic)`
  align-self: end;
  margin: auto;
`;

const FooterContent = styled.div`
  margin-right: auto;
  padding: 12px;
`;

const LearnMoreLink = withHsTheme(styled.a`
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  color: ${() => getThemeValue(t => t.colors.secondary)};
  font-weight: 700;
`);

const LinkText = styled.span`
  text-decoration: underline;
`;

const ExternalLinkIconStyled = withHsTheme(styled(Icon)`
  margin-right: 4px;
`);

export const ExternalLinkIcon = withHsTheme(() => (
  <ExternalLinkIconStyled
    glyph={BoxArrowTopRightOutline}
    fill="currentColor"
    size={getThemeValue(t => t.spacing.spacing16)}
  />
));

const TypedIcon = styled(Icons)<{ children?: React.ReactNode }>``;

const ComposeOptionsModal = ({ onClose }: { onClose: () => void }) => {
  const $i18n = useWithI18n({
    DialogTitle: '{name}, how do you want to create your post?',
    LearnMore: 'Learn more about AI content creation',
    ComposerOptionLabel: 'Start from scratch',
    ComposerOptionDescription: 'I want to write my own content.',
    OwlyWriterOptionLabel: 'Create with AI',
    OwlyWriterOptionDescription: 'I want post ideas and captions.',
  });

  const firstName = window?.hs?.memberName?.split(' ')[0];

  return (
    <Lightbox padding={PADDING_MINIMAL}>
      {({ close }: { close: () => void }) => {
        const closeAndResetState = () => {
          close();
          onClose();
        };

        return (
          <StyledA11yDialog closeModal={closeAndResetState} ariaLabelledBy="compose-options-modal-title">
            <StyledDialog>
              <TypedIcon>
                <Icons.Close close={closeAndResetState} />
              </TypedIcon>
              <StyledHeader>
                <StyledTitle id="compose-options-modal-title">{$i18n.DialogTitle({ name: firstName })}</StyledTitle>
              </StyledHeader>
              <Content>
                <ComposeOptions>
                  <OptionCard>
                    <OptionCardButton
                      title={$i18n.ComposerOptionLabel()}
                      description={$i18n.ComposerOptionDescription()}
                      icon={Pencil}
                      onClick={() => {
                        track(TRACKING_ORIGIN_COMPOSE_OPTIONS, TRACKING_EVENT_CLICKED_COMPOSER);
                        emit('composer.open');
                        closeAndResetState();
                      }}
                    />
                  </OptionCard>
                  <OptionCard>
                    <OptionCardButton
                      title={$i18n.OwlyWriterOptionLabel()}
                      description={$i18n.OwlyWriterOptionDescription()}
                      image={<StyledOwlyWriterGraphic width={232} height={232} />}
                      onClick={() => {
                        track(TRACKING_ORIGIN_COMPOSE_OPTIONS, TRACKING_EVENT_CLICKED_OWLYWRITER);
                        window.location.hash = '#/inspiration?get-inspired';
                        closeAndResetState();
                      }}
                      hasBetaBadge
                    />
                  </OptionCard>
                </ComposeOptions>
              </Content>
              <StyledFooter>
                <FooterContent>
                  <LearnMoreLink href={HELP_LINK} rel="noopener noreferrer" target="_blank">
                    <ExternalLinkIcon />
                    <LinkText>{$i18n.LearnMore()}</LinkText>
                  </LearnMoreLink>
                </FooterContent>
              </StyledFooter>
            </StyledDialog>
          </StyledA11yDialog>
        );
      }}
    </Lightbox>
  );
};

export default ComposeOptionsModal;
