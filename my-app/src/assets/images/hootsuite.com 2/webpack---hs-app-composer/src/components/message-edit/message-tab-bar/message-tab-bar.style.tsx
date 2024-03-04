import styled from 'styled-components'
import Icon from '@fp-icons/icon-base'
import ToggleBar from 'fe-comp-toggle-bar'

export const TabBarContainer = styled.div``

export const StyledToggleBar = styled(ToggleBar)`
  max-width: 40px;
  max-height: 44px;
`

export const ContentTabContainer = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
`

export const ContentTabTextContainer = styled.div`
  padding-left: 10px;
`

export const StyledIcon = styled(Icon)`
  margin-left: 8px;
  max-height: 16px;
`

TabBarContainer.displayName = 'MessageTabBarContainer'
StyledToggleBar.displayName = 'StyledToggleBar'
ContentTabContainer.displayName = 'ContentTabContainer'
ContentTabTextContainer.displayName = 'ContentTabTextContainer'
StyledIcon.displayName = 'StyledIcon'
