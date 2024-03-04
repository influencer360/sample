import React from 'react';
import styled from 'styled-components';
import excellent_check from 'assets/excellent_check.png';
import fair_check from 'assets/fair_check.png';
import good_check from 'assets/good_check.png';
import great_check from 'assets/great_check.png';

const imageMap: { [key: string]: string } = {
  Excellent: excellent_check,
  Great: great_check,
  Good: good_check,
  Fair: fair_check,
};
const ScoreScaleWrapper = styled.table`
  width: 100%;
  border-spacing: 0;
  font-size: 16px;
  color: #1c1c1c;
  border-collapse: separate;
  border-spacing: 0 4px;
`;

const TableRow = styled.tr`
  background-color: ${({ color }) => color};
  height: 48px;
`;

const TableCell = styled.td`
  padding: 12px 12px;
  width: min-content;
  &:nth-child(2) {
    text-align: left;
    width: max-content;
  }
  &:nth-child(3) {
    text-align: right;
  }
  &:last-child {
    padding-right: 16px;
  }
`;

const ColorColumn = styled.td`
  width: 6px;
  background-color: ${({ color }) => color};
  border-bottom-left-radius: 4px;
  border-top-left-radius: 4px;
`;

const ScoreScalesData = [
  { scaleName: 'Excellent', range: { min: 900, max: 1000 }, color: '#01841E', backgroundColor: '#E6F3E9' },
  { scaleName: 'Great', range: { min: 700, max: 899 }, color: '#2269DD', backgroundColor: '#E9F0FC' },
  { scaleName: 'Good', range: { min: 500, max: 699 }, color: '#FFB333', backgroundColor: '#FFF7EB' },
  { scaleName: 'Fair', range: { min: 0, max: 499 }, color: '#FF6937', backgroundColor: '#FFF0EB' },
];

type ScoreScaleProps = {
  score: number;
};

const ScoreScale = ({ score }: ScoreScaleProps) => {
  return (
    <ScoreScaleWrapper>
      <tbody>
        {ScoreScalesData.map(scale => {
          const { min, max } = scale.range;
          const isInRange = score >= min && score <= max;
          return (
            <TableRow key={scale.scaleName} color={scale.backgroundColor}>
              <ColorColumn color={scale.color} />
              <TableCell>{scale.scaleName}</TableCell>
              <TableCell>
                {scale.range.min} - {scale.range.max}
              </TableCell>
              <TableCell> {isInRange && <img src={imageMap[scale.scaleName]} alt="check sign" />}</TableCell>
            </TableRow>
          );
        })}
      </tbody>
    </ScoreScaleWrapper>
  );
};

export default ScoreScale;
