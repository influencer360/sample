import React from 'react';
import styled from 'styled-components';

const ScoreWrapper = styled.div`
  display: flex;
  align-items: baseline;
  font-family: Montserrat Alternates;
  margin-bottom: 16px;
`;

const CurrentScore = styled.div`
  color: #1c1c1c;
  font-size: 64px;
  font-weight: 700;
  margin-right: 15px;
`;

const TotalScore = styled.div`
  color: #5c5c5c;
  font-size: 16px;
  font-weight: 400;
  &::before {
    content: '/';
  }
`;

type ScoreProps = {
  score: number;
};

const totalScore = 1000;
const Score = ({ score }: ScoreProps) => {
  return (
    <ScoreWrapper>
      <CurrentScore>{score}</CurrentScore>
      <TotalScore>{totalScore}</TotalScore>
    </ScoreWrapper>
  );
};

export default Score;
