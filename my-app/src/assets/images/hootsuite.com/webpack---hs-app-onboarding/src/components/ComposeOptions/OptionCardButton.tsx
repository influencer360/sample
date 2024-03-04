import React from 'react';

import styled from 'styled-components';
import Icon from '@fp-icons/icon-base';
import type { Glyph } from '@fp-icons/icon-types';
import { withHsTheme, getThemeValue } from 'fe-lib-theme';
import PropTypes from 'fe-prop-types';
import Element = React.JSX.Element;

const Button = withHsTheme(styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: start;
  flex-direction: column;
  width: 100%;
  padding: 48px;
  background: ${getThemeValue(t => t.colors.lightGrey10)};
  border: 1px solid ${getThemeValue(t => t.colors.darkGrey20)};
  border-radius: 2px;
  transition: all 0.1s ease-in-out;

  &&:hover {
    box-shadow: 4px 4px 0 0 ${getThemeValue(t => t.colors.complementaryOrange40)};
  }

  &&:hover:not(:active),
  &&:focus:not(:active) {
    box-shadow:
      0 0 0 2px ${getThemeValue(t => t.colors.focusBorder)},
      6px 6px 0 0 ${getThemeValue(t => t.colors.complementaryOrange40)};
  }

  &&:active {
    box-shadow:
      0 0 0 2px ${getThemeValue(t => t.colors.complementaryOrange)},
      6px 6px 0 0 ${getThemeValue(t => t.colors.complementaryOrange40)};
  }
`);

const ButtonLabel = styled.span`
  display: inline-block;
  font-weight: ${getThemeValue(t => t.typography.fontWeight.normal)};
  margin-top: 12px;
`;

const ButtonTitle = styled(ButtonLabel)`
  font-size: 20px;
  font-weight: 600;
`;

const ButtonDescription = styled(ButtonLabel)`
  color: ${getThemeValue(t => t.colors.darkGrey80)};
  font-size: 16px;
  font-weight: 400;
`;

const StyledIcon = withHsTheme(styled(Icon)`
  color: ${getThemeValue(t => t.colors.primary)};
  width: 60px;
  margin: auto;
`);

const BetaBadgeContainer = withHsTheme(styled.div`
  color: ${getThemeValue(t => t.colors.primary)};
  position: absolute;
  right: 7px;
  top: 7px;
  border-radius: 50px;
  background: ${getThemeValue(t => t.colors.complementaryOrange10)};
  padding: 6px 12px;
  font-size: 17px;
  font-weight: 700;
`);

const Graphic = styled.div`
  display: flex;
  height: 232px;
  width: 232px;
`;

const Labels = styled.div`
  display: flex;
  flex-direction: column;
`;

type OptionCardProps = {
  title: string;
  description: string;
  onClick: () => void;
  icon?: Glyph;
  image?: Element;
  hasBetaBadge?: boolean;
};
const OptionCardButton = ({ icon, image, title, description, onClick, hasBetaBadge }: OptionCardProps) => {
  return (
    <Button onClick={onClick} role="button">
      {hasBetaBadge && <BetaBadgeContainer>BETA</BetaBadgeContainer>}
      <Graphic>
        {icon && <StyledIcon glyph={icon} size={'60px'} aria-hidden="true" />}
        {image}
      </Graphic>
      <Labels>
        <ButtonTitle>{title}</ButtonTitle>
        <ButtonDescription>{description}</ButtonDescription>
      </Labels>
    </Button>
  );
};

OptionCardButton.displayName = 'OptionCardButton';

OptionCardButton.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.any,
  image: PropTypes.func,
  hasBetaBadge: PropTypes.bool,
};

export default OptionCardButton;
