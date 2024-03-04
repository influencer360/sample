import React from 'react';
import styled from 'styled-components';
import { roundNumber } from 'utils/roundNumber';

const FactorsWrapper = styled.table`
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  box-sizing: border-box;
  background: #f7f8f9;
  border-collapse: separate;
  margin-bottom: 16px;

  thead {
    border-bottom: 1px solid #ebebeb;
    display: block;
    width: 100%;
  }

  tbody {
    display: inline-table;
    width: 100%;
  }

  th {
    padding: 14px 0;
    color: #1c1c1c;
    font-size: 16px;
    font-weight: 600;
    text-align: left;
  }

  td {
    text-align: right;
    padding: 14px 0;
    font-size: 16px;
    font-weight: 600;
    &:first-child {
      text-align: left;
      padding-right: 24px;
    }
  }
`;

const Currentvalue = styled.div<{ isPercentage: boolean }>`
  display: inline-flex;
  margin-right: 5px;
  font-size: 22px;
  &:after {
    content: ${props => (props.isPercentage ? '"%"' : '""')};
  }
`;

const IncreasedValue = styled.div<{ isPercentage: boolean; value: number }>`
  display: inline-flex;
  color: ${props => (props.value >= 0 ? '#01781b' : '#e60000')};
  font-size: 14px;
  vertical-align: text-top;
  &:after {
    content: ${props => (props.isPercentage ? '"%"' : '""')};
  }
`;

const SignIndicator = styled.span<{ value: number }>`
  color: ${props => (props.value >= 0 ? '#01781b' : '#e60000')};
  font-size: 14px;
  vertical-align: text-top;
`;

type MetricData = {
  metricName: string;
  previousValue: number;
  currentValue: number;
};

type SubScoreFactorsProps = {
  metrics: MetricData[];
};

const formatNumber = (num: number): string => {
  const absNum = Math.abs(num);
  const abbreviatedNum = (n: number, divider: number, suffix: string) => {
    const formatted = n / divider;
    const formattedString = formatted < 10 ? formatted.toFixed(1) : formatted.toFixed(0);
    return formattedString.endsWith('.0') ? formattedString.slice(0, -2) + suffix : formattedString + suffix;
  };

  if (absNum >= 1e6) {
    return abbreviatedNum(num, 1e6, 'M');
  } else if (absNum >= 1e3) {
    return abbreviatedNum(num, 1e3, 'K');
  }

  return num.toString();
};

const SubScoreFactors = ({ metrics }: SubScoreFactorsProps) => {
  return (
    <FactorsWrapper>
      <tbody>
        {metrics.map(metric => {
          const isPercentageValue = metric.metricName === 'Avg post engagement rate';
          const difference = roundNumber(metric.currentValue - metric.previousValue, 1);
          const sign = difference >= 0 ? '+' : '';
          return (
            <tr key={metric.metricName}>
              <td>{metric.metricName}</td>
              <td>
                <Currentvalue isPercentage={isPercentageValue}>{formatNumber(metric.currentValue)}</Currentvalue>
                <IncreasedValue isPercentage={isPercentageValue} value={difference}>
                  <SignIndicator value={difference}>{sign}</SignIndicator>
                  {isPercentageValue ? Math.abs(difference) : formatNumber(difference)}
                </IncreasedValue>
              </td>
            </tr>
          );
        })}
      </tbody>
    </FactorsWrapper>
  );
};

export default SubScoreFactors;
