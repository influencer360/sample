import React from 'react';
import styled from 'styled-components';
import { emit } from 'fe-lib-hootbus';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { isInFirst30DayUXExperiment } from 'App';
import { Button, OUTLINED } from 'components/Button';
import { OPEN_COMPOSER } from 'constants/hootbus-actions';
import {
  TRACKING_EVENT_USER_CLICKS_SEE_ALL_DRAFTS,
  TRACKING_ORIGIN_HOMEPAGE,
  TRACKING_EVENT_USER_CLICKS_CREATE_A_DRAFT,
} from 'constants/tracking';
import { useDrafts } from 'hooks/useDrafts';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import { Sizes, Widget } from '../Widget';
import Draft from './Draft';

type DraftsProps = {
  $i18n: {
    title: () => string;
    cta: () => string;
    create: () => string;
  };
};

const DraftList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
`;

const Drafts = ({ $i18n }: DraftsProps) => {
  const { drafts, contentMap, isLoading, hasError, shouldAnimate } = useDrafts(3);
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;

  let widgetStatus;

  if (isLoading) {
    widgetStatus = RequestStatusType.LOADING;
  } else if (hasError) {
    widgetStatus = RequestStatusType.ERROR;
  } else if (drafts.length === 0) {
    widgetStatus = RequestStatusType.EMPTY;
  } else {
    widgetStatus = RequestStatusType.SUCCESS;
  }

  function onCTAClick() {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_SEE_ALL_DRAFTS, {
      widgetName: WidgetName.DRAFTS,
    });
    window.location.hash = '#/planner?view=drafts';
  }

  return (
    <Widget
      name={WidgetName.DRAFTS}
      status={widgetStatus}
      size={Sizes.MEDIUM}
      minHeight={showFirst30DaysExperiment ? '644px' : RequestStatusType.ERROR ? '400px' : 'auto'}
      title={$i18n.title()}
      subtitle={'Recently edited'}
      cta={$i18n.cta()}
      showCta={
        showFirst30DaysExperiment
          ? widgetStatus !== RequestStatusType.SUCCESS
            ? false
            : true
          : drafts.length > 0 || widgetStatus !== RequestStatusType.SUCCESS
      }
      onClickCta={onCTAClick}
    >
      <DraftList>
        {drafts.length &&
          drafts.map((draft, index) => (
            <Draft
              key={draft.id}
              draftId={draft.id}
              creatorName={draft.creatorName}
              socialProfileIds={[...draft.socialProfileIds]}
              lastModifiedDate={draft.lastModifiedDate}
              contentMap={contentMap}
              firstDraft={index === 0 && shouldAnimate}
              draftMessage={{
                attachments: [...draft.attachments],
                text: draft.text,
              }}
            />
          ))}
      </DraftList>
      <Button
        onClick={() => {
          emit(OPEN_COMPOSER);
          track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_CREATE_A_DRAFT, {
            wigetName: WidgetName.DRAFTS,
          });
        }}
        type={OUTLINED}
      >
        {$i18n.create()}
      </Button>
    </Widget>
  );
};

export default withI18n({
  title: 'Your drafts',
  cta: 'Manage all drafts',
  create: 'Create a draft',
})(Drafts);
