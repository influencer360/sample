import React from 'react';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';
import congratulations from 'assets/congratulations.png';
import breakpoints from 'utils/breakpoints';

const CongratulationsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    flex-direction: column-reverse;
    align-items: center;
  }
`;

const TextContainer = styled.div`
  font-size: 56px;
  font-weight: 600;
  line-height: 72px;
  letter-spacing: 0px;
  text-align: left;
  font-family: Montserrat Alternates;
  align-self: center;
  width: 50%;
  margin: auto;
  margin-right: 40px;
  display: flex;
  flex-direction: column;

  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    font-size: 36px;
    flex-direction: row;
    width: 100%;
    margin-top: 24px;
  }

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    font-size: 24px;
  }
`;

const TextWrapper = styled.div`
  width: 525px;
  align-self: center;
  margin-right: 8px;
  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    width: 325px;
  }
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    width: auto;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  width: 50%;
  overflow: hidden;
  border-radius: 8px;
  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    width: 100%;
  }
`;

const StyledImage = styled.img`
  width: 782px;
  height: 440px;
`;

type CongratulationsProps = {
  $i18n: {
    congratulations: () => string;
    youDidIt: () => string;
  };
};

const Congratulations = ({ $i18n }: CongratulationsProps) => {
  return (
    <CongratulationsContainer>
      <TextContainer>
        <TextWrapper>{$i18n.congratulations()}</TextWrapper>
        <TextWrapper>
          {' '}
          {$i18n.youDidIt()}{' '}
          <span role="img" aria-label="confetti">
            🎉
          </span>
        </TextWrapper>
      </TextContainer>
      <ImageContainer>
        <StyledImage alt="" src={congratulations} />
      </ImageContainer>
    </CongratulationsContainer>
  );
};

export default withI18n({
  congratulations: 'Congratulations, ',
  youDidIt: ' You did it!',
})(Congratulations);
