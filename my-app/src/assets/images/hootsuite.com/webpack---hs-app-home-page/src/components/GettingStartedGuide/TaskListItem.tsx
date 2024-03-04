import React, { MouseEventHandler, useEffect, Dispatch } from 'react';
import styled from 'styled-components';
import Icon from '@fp-icons/icon-base';
import Check from '@fp-icons/symbol-check';
import { withHsTheme, getThemeValue } from 'fe-lib-theme';
import TaskListContent from './TaskListContent';

const TaskListItemWrapper = styled.li`
  position: relative;
  display: flex;
  width: 100%;
  align-items: flex-start;
`;

const CompletionWrapper = withHsTheme(styled.div<{ isComplete: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  height: 100%;
  margin-top: 8px;

  ${TaskListItemWrapper}:not(:last-child) &&::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translate3d(-50%, 0, 0);
    width: 3px;
    height: 100%;
    background: ${p => (p.isComplete ? '#333333' : '#EEF1F2')};
  }
`);

const CompletionIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  z-index: 5;
  background: #333333;
  padding: 6px;
  color: #fdfdfd;
`;

const IncompleteIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  z-index: 5;
  background: #eef1f2;
  padding: 6px;
  color: #1c1c1c;
`;

const ActiveIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  z-index: 5;
  background: #5c5c5c;
  padding: 6px;
  color: #fdfdfd;
`;

const ContentWrapper = styled.div`
  width: 100%;
  margin: 0 0 8px 16px;
`;

const Step = styled.div`
  text-align: center;
  font-family: 'Source Sans Pro';
  font-size: 22px;
  font-style: normal;
  font-weight: 600;
  line-height: 32px;
`;

const TitleContainer = withHsTheme(styled.div<{ isActive: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing8)};
  height: ${p => (p.isActive ? '20px' : '64px')};
  width: 100%;
  margin-top: ${p => p.isActive && '8px'};
`);

const TitleText = withHsTheme(styled.div`
  color: #1c1c1c;
  font-family: 'Source Sans Pro';
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px; /* 150% */
`);

type TaskListItemProps = {
  title: React.ReactNode;
  completedTitle: React.ReactNode;
  isComplete: boolean;
  onClickTask?: MouseEventHandler;
  step: number;
  isPreviousComplete: boolean;
  content?: {
    description: string;
    buttonText: string;
  };
  setActiveStep: Dispatch<number>;
};

const TaskListItem = ({
  title,
  completedTitle,
  isComplete = false,
  onClickTask,
  step,
  isPreviousComplete,
  content,
  setActiveStep,
}: TaskListItemProps): JSX.Element => {
  useEffect(() => {
    if (!isComplete && isPreviousComplete) {
      setActiveStep(step);
    }
  }, [isComplete, isPreviousComplete, setActiveStep, step]);
  return (
    <TaskListItemWrapper>
      <CompletionWrapper isComplete={isComplete}>
        {isComplete && (
          <CompletionIndicator>
            <Icon glyph={Check} fill="#FCFCFB" size={12} />
          </CompletionIndicator>
        )}
        {!isComplete && isPreviousComplete && (
          <ActiveIndicator>
            <Step>{step}</Step>
          </ActiveIndicator>
        )}
        {!isComplete && !isPreviousComplete && (
          <IncompleteIndicator>
            <Step>{step}</Step>
          </IncompleteIndicator>
        )}
      </CompletionWrapper>
      <ContentWrapper>
        <TitleContainer isActive={!isComplete && isPreviousComplete}>
          <TitleText>
            {!isComplete && title}
            {isComplete && completedTitle}
          </TitleText>
        </TitleContainer>
        {content && !isComplete && isPreviousComplete && (
          <TaskListContent
            description={content.description}
            buttonText={content.buttonText}
            onClickTask={onClickTask}
          />
        )}
      </ContentWrapper>
    </TaskListItemWrapper>
  );
};

export default TaskListItem;
