/* eslint-disable react/prop-types */
import React from 'react';
import { CreateTeamModal } from 'fe-member-comp-create-team-modal';
import { Lightbox } from './Lightbox';

export type CreateTeamModalWrapperProps = {
  organization: {
    id: string;
    name: string;
  };
  onClose: () => void;
};

const CreateTeamModalWrapper = ({ onClose, organization }: CreateTeamModalWrapperProps): JSX.Element => {
  return (
    <Lightbox>
      {({ close }: { close: () => void }) => {
        return (
          <CreateTeamModal
            onClose={() => {
              onClose();
              close();
            }}
            organization={organization}
          />
        );
      }}
    </Lightbox>
  );
};

export default CreateTeamModalWrapper;
