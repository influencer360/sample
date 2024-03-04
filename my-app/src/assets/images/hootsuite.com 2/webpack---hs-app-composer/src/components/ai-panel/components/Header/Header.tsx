import React from 'react'

import { AS_LINK } from 'fe-comp-button'
import { H2 } from 'fe-comp-dom-elements'
import { useWithI18n } from 'fe-lib-i18n'

import { AIPanelHeaderProps } from '../../types'
import { HeaderContainer, LinkButton } from './Header.styles'

const Header: React.FC<AIPanelHeaderProps> = ({ onClose }) => {
  const $i18n = useWithI18n({
    title: 'OwlyWriter AI',
    close: 'Close',
  })

  return (
    <HeaderContainer>
      <div className="left">
        <H2>{$i18n.title()}</H2>
      </div>
      <div className="right">
        <LinkButton onClick={onClose} type={AS_LINK}>
          {$i18n.close()}
        </LinkButton>
      </div>
    </HeaderContainer>
  )
}

export default Header
