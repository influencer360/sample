import { optimizelyReactSdk } from 'fe-lib-optimizely';

const DraftFirstPostExistingUsersExperiment = () => {
  optimizelyReactSdk.useDecision('grw_ss_onboarding_7_1');

  return null;
};

export default DraftFirstPostExistingUsersExperiment;
