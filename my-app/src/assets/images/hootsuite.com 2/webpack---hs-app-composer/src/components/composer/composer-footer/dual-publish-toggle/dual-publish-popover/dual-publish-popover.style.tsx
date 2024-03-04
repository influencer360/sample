import styled from 'styled-components'
import { Button } from 'fe-comp-button'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

const PopoverContentContainer = venk(
  styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 2px;
  `,
  'PopoverContent',
)
const PopoverBodyContainer = venk(
  styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  `,
  'PopoverBody',
)

const ProfileContainer = venk(
  styled.div`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    margin-top: 14px;
    max-height: 165px;
    overflow: auto;
  `,
  'ProfileContainer',
)

const Profile = withHsTheme(
  venk(
    styled.div`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      box-sizing: border-box;
      width: 100%;
      padding: ${() => getThemeValue(t => t.spacing.spacing8)};
      margin-bottom: ${() => getThemeValue(t => t.spacing.spacing8)};
      background-color: ${() => getThemeValue(t => t.colors.lightGrey40)};
    `,
    'Profile',
  ),
)

const PopoverButton = withHsTheme(
  venk(
    styled(Button)`
      margin-left: ${() => getThemeValue(t => t.spacing.spacing8)};
    `,
    'DualPublishPopoverButton',
  ),
)

ProfileContainer.displayName = 'ProfileContainer'
Profile.displayName = 'Profile'
PopoverButton.displayName = 'PopoverButton'

export { PopoverContentContainer, PopoverBodyContainer, ProfileContainer, Profile, PopoverButton }
