import once from 'lodash/once'
import { add as addCallout } from 'fe-lib-async-callouts'
import { CALLOUTS } from 'fe-comp-callout'
import { jsxFromTemplate } from 'fe-pnc-lib-utils'

import translation from 'utils/translation'

const SETTING_NAME = 'hasSeenBrand2020RefreshCallout'
const TITLE = translation._('We’ve kept everything here the same!')
const MESSAGE = translation._('You can stay up to date on any updates in our %aWhat’s New%/a')

const hasSeenBrand2020RefreshCallout = () =>
  window.hs &&
  window.hs.memberExtras &&
  window.hs.memberExtras.publisherSettings &&
  window.hs.memberExtras.publisherSettings[SETTING_NAME]

const displayCallout = () => {
  const text = jsxFromTemplate(MESSAGE, [
    {
      target: '_blank',
      rel: 'noopener noreferrer',
      href: 'https://hootsuite.com/whats-new',
    },
  ])

  addCallout({
    calloutType: CALLOUTS.TOAST.NAME,
    titleText: TITLE,
    children: text,
  })
}

const flagCalloutAsSeen = () =>
  ajaxCall(
    {
      method: 'POST',
      url: '/ajax/member/set-publisher-setting',
      json: { settingName: SETTING_NAME, value: true },
    },
    'q1NoAbort'
  )

export const displayOneOffBrand2020RefreshCallout = once(() => {
  if (!hasSeenBrand2020RefreshCallout()) {
    displayCallout()
    flagCalloutAsSeen()
  }
})
