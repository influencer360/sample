import React, { MouseEventHandler } from 'react';
import styled from 'styled-components';
import { Button, OUTLINED } from 'components/Button';

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 8px;
`;

const Description = styled.div`
  color: #5c5c5c;
  font-family: 'Source Sans Pro';
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  margin-bottom: 8px;
`;

const StyledButton = styled(Button)`
  border-radius: 8px;
  font-size: 14px;
`;

type TaskListContentProps = {
  description: string;
  buttonText: string;
  onClickTask: MouseEventHandler | undefined;
};

const TaskListContent = ({ description, buttonText, onClickTask }: TaskListContentProps): JSX.Element => {
  return (
    <ContentWrapper>
      <Description>{description}</Description>
      <StyledButton type={OUTLINED} onClick={onClickTask} width="fit-content">
        {buttonText}
      </StyledButton>
    </ContentWrapper>
  );
};

export default TaskListContent;
