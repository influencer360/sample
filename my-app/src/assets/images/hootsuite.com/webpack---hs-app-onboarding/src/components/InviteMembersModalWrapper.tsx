/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { getOrganizationsByMemberId } from 'fe-adp-lib-client-organization';
import { withDarklaunch } from 'fe-lib-darklaunch';
import { InviteOrgMembersModal, InviteMembersModal } from 'fe-member-comp-invite-org-members';
import { Lightbox } from './Lightbox';

type InviteMembersModalWrapperProps = {
  onClose: () => void;
  onComplete: () => void;
  $dl: {
    APV_168_BULK_INVITATION: boolean;
    APV_168_BULK_INVITATION_BETA: boolean;
  };
};

type Organization = {
  id: number;
  name?: string;
  logo?: string;
  allowSocialLogin?: boolean;
  allowPrivateNetworks?: boolean;
  isMemberPublic?: boolean;
  defaultSpPermissionCodes?: Array<string>;
  createdDate?: string;
  createdUser?: number;
  modifiedDate?: string;
  modifiedUser?: number;
  portfolioProductCode?: string;
  errors?: Array<number>;
  errorDetails?: Array<ErrorDetails>;
  paymentMemberId?: number;
};

type ErrorDetails = {
  code?: number;
  message?: string;
};

const InviteMembersModalWrapper = ({ onClose, onComplete, $dl }: InviteMembersModalWrapperProps): JSX.Element => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    getOrganizationsByMemberId(String(window.hs.memberId)).then(response => {
      setOrganizations(response);
    });
  }, []);
  return (
    <Lightbox>
      {({ close }: { close: () => void }) => {
        if (organizations.length > 0 && organizations[0].name && organizations[0].paymentMemberId) {
          return $dl.APV_168_BULK_INVITATION || $dl.APV_168_BULK_INVITATION_BETA ? (
            <InviteMembersModal
              organization={{
                id: organizations[0].id,
                name: organizations[0].name,
                payingMemberId: organizations[0].paymentMemberId,
              }}
              onClose={() => {
                onClose();
                close();
              }}
              onComplete={onComplete}
            />
          ) : (
            <InviteOrgMembersModal
              onClose={() => {
                onClose();
                close();
              }}
              withQueryClient
              organization={{
                id: organizations[0].id,
                name: organizations[0].name,
                payingMemberId: organizations[0].paymentMemberId,
              }}
            />
          );
        }
      }}
    </Lightbox>
  );
};

export default withDarklaunch(['APV_168_BULK_INVITATION', 'APV_168_BULK_INVITATION_BETA'])(InviteMembersModalWrapper);
