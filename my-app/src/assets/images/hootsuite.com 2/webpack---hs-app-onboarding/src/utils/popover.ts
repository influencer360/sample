import { startWalkthrough, exitWalkthrough } from 'fe-billing-lib-walkthrough';
import { provisionIndex } from 'fe-lib-zindex';

type PopoverOptions = {
  target: string;
  placement:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end';
  title?: React.ReactNode | (() => React.ReactNode);
  description?: React.ReactNode | (() => React.ReactNode);
  next?: string;
  onNext?: () => void;
  trackingName?: string;
  hasExitOnBackgroundClick?: boolean;
  showSpotlight?: boolean;
  spotlightTargets?: {
    target: string;
    paddingBottom: number;
  }[];
  spotlightPaddingRight?: number;
  spotlightPaddingBottom?: number;
  spotlightPadding?: number;
  spotlightPaddingLeft?: number;
  spotlightPaddingTop?: number;
  spotlightBorderRadius?: number;
  width?: string | number;
  offset?: number | string;
  isTargetDisabled?: boolean;
  onPrev?: () => void;
  onExit?: () => void;
  onEnter?: () => void;
  prev?: string;
  exit?: string;
  hideNext?: boolean;
  hidePrev?: boolean;
  hideExit?: boolean;
};

export function showPopover(options: PopoverOptions) {
  startWalkthrough(
    [
      {
        hideExit: false,
        hidePrev: true,
        ...options,
      },
    ],
    {
      hasExit: false,
      showSpotlight: options.showSpotlight == undefined ? true : options.showSpotlight,
      showSteps: false,
      trackingOrigin: 'web.dashboard.hs_app_onboarding',
      zIndex: provisionIndex(),
    },
  );
}

export function closePopover() {
  exitWalkthrough();
}
