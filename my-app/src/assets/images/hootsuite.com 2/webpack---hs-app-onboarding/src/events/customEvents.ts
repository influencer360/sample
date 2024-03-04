import * as gettingStarted from './handlers/gettingStarted';

export const customEvents = [
  //grw_ss_onboarding_4_0 - Onboarding Redirect Experiment
  ['pendoOnboardingTourDismissed', gettingStarted.handleOpenGettingStartedGuide],
] as const;
