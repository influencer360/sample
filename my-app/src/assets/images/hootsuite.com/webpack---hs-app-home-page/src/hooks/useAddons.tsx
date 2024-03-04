import { useEffect, useState } from 'react';
import { fetchMemberAddons, fetchAvailableAddons } from 'services/addons';
import { AccountAddon, AddOn } from 'typings/addons';
import { RequestStatusType } from 'typings/Shared';

const useAddons = (callAddonsService: boolean) => {
  const [memberAddons, setMemberAddons] = useState<AccountAddon[]>([]);
  const [availableAddons, setAvailableAddons] = useState<AddOn[]>([]);
  const [addonsStatus, setStatus] = useState(RequestStatusType.LOADING);

  useEffect(() => {
    setStatus(RequestStatusType.LOADING);
    const memberId = window.hs?.memberId;

    if (callAddonsService && memberId) {
      fetchMemberAddons(memberId)
        .then(memberAddonsData => {
          if (memberAddonsData) {
            setMemberAddons(memberAddonsData);
          }
          fetchAvailableAddons(memberId)
            .then(availableAddonsData => {
              if (availableAddonsData) {
                setAvailableAddons(availableAddonsData);
              }
              setStatus(RequestStatusType.SUCCESS);
            })
            .catch(() => {
              setStatus(RequestStatusType.ERROR);
            });
        })
        .catch(() => {
          setStatus(RequestStatusType.ERROR);
        });
    } else {
      setStatus(RequestStatusType.EMPTY);
      setAvailableAddons([]);
      setMemberAddons([]);
    }
  }, []);

  return { addonsStatus, memberAddons, availableAddons };
};

export { useAddons };
