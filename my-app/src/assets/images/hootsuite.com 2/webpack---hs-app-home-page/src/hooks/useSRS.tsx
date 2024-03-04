import { useEffect, useState } from 'react';
import { fetchSRScore } from 'services/socialRelationshipScore';
import { RequestStatusType } from 'typings/Shared';
import { MemberSRSResponse } from 'typings/SocialRelationshipScore';
import darklaunch from 'utils/darklaunch';
import { roundNumber } from 'utils/roundNumber';

function normalizeSrsResponse(srsData: MemberSRSResponse) {
  srsData.srs.map(srsItem => {
    if (srsItem) {
      srsItem.score = roundNumber(srsItem.score);
      srsItem.insights.avgPostEngagement.value = roundNumber(srsItem.insights.avgPostEngagement.value, 1);
    }
    return srsItem;
  });
}

const useSRS = () => {
  const [srsResponse, setSRSResponse] = useState<MemberSRSResponse>();
  const [srsStatus, setSRSStatus] = useState(RequestStatusType.LOADING);

  const isSRSEnabled = !!darklaunch.isFeatureEnabled('SRS_67_SRS_INTENT_TEST_ACCESS');

  useEffect(() => {
    if (isSRSEnabled) {
      setSRSStatus(RequestStatusType.LOADING);
      fetchSRScore()
        .then(srsData => {
          normalizeSrsResponse(srsData);
          setSRSResponse(srsData);
          setSRSStatus(RequestStatusType.SUCCESS);
        })
        .catch(() => {
          setSRSStatus(RequestStatusType.ERROR);
        });
    } else {
      setSRSStatus(RequestStatusType.EMPTY);
      setSRSResponse(undefined);
    }
  }, [isSRSEnabled]);

  return { srsStatus, srsResponse };
};

export { useSRS };
