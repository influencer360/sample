import * as handlers from './handlers';
import * as gettingStarted from './handlers/gettingStarted';
import * as keyboardShortcuts from './handlers/keyboardShortcuts';

export const events = [
  ['streams:onboarding:complete', handlers.showPopoverOrganizeStreams],
  ['stream:postLoad:complete', handlers.showPopoverPrepopulatedStreams],
  ['dashboard:streamsBuilder:RTPPopover:show', handlers.showRTPPlannerPopoverStreams],
  ['dashboard:planner:contentCalendar:show', handlers.showContentCalendarPopover],
  ['dashboard:onboarding:publishingReminders:reminderModal:show', handlers.showPublishingRemindersModal],
  ['dashboard:onboarding:publishingReminders:ctaModal:show', handlers.showPublishingRemindersCtaModal],

  // Account Setup
  ['accountSetup:removeSocialNetworkModal:show', handlers.showRemoveSocialNetworkModal],

  // Getting Started Guide
  ['dashboard:gettingStarted:open', gettingStarted.handleOpenGettingStartedGuide],
  ['dashboard:gettingStarted:close', gettingStarted.handleCloseGettingStartedGuide],
  ['dashboard:gettingStarted:createTeamModal:show', gettingStarted.showCreateTeamModal],
  ['dashboard:gettingStarted:inviteMembersModal:show', gettingStarted.showInviteMembersModal],
  ['dashboard:gettingStarted:inviteMembersModal:success', gettingStarted.handleInviteMembersTask],
  ['dashboard:gettingStarted:createTeamModal:success', gettingStarted.handleCreateTeamTask],
  ['socialNetwork:refresh:success', gettingStarted.handleAddSocialAccountsTask],
  ['full_screen_composer:response:message_success', gettingStarted.handleSchedulePostTask],
  ['dashboard:gettingStarted:showPopover', gettingStarted.showPopoverGetStartedGuideNavPopover],

  // Keyboard Shortcuts
  ['keyboard:shortcut:composer:show', keyboardShortcuts.maximizeComposer],
] as const;
