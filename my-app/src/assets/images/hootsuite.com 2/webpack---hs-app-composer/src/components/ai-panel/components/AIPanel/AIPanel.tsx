import React, { useEffect, useRef } from 'react'
import { connect as reduxConnect } from 'react-redux'
import { compose } from 'fe-hoc-compose'
import { useWithI18n } from 'fe-lib-i18n'
import { FocusManager } from 'fe-pnc-lib-focus-manager'
import { capitalizeFirstLetter } from '@/components/message-edit/message-tab-bar/helpers'
import { RootState } from '@/redux/store'
import { AIPanelProps } from '../../types'
import FeatureSelection from '../FeatureSelection'
import Header from '../Header'
import {
  CenterColumn,
  Container,
  DescriptionContainer,
  Description,
  FadeIn,
  ScrollContainer,
} from './AIPanel.styles'

export const AIPanel: React.FC<AIPanelProps> = ({ selectedNetworkGroup, onClose }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (containerRef?.current) {
      const focusRoot = containerRef.current

      FocusManager.addElement(focusRoot)
      FocusManager.safeFocus(FocusManager.getFocusableElements()[0])

      return () => {
        FocusManager.remove(focusRoot)
      }
    }
  }, [containerRef])

  const $i18n = useWithI18n({
    description: 'Recommendations on your <highlight>{socialNetworkGroup}</highlight> post',
  })

  const onSelectFeature = () => {}
  const onSelectToneFeature = () => {}

  return (
    <Container ref={containerRef}>
      <Header onClose={onClose} />
      <ScrollContainer>
        <FadeIn>
          <CenterColumn>
            <DescriptionContainer>
              <Description>
                {$i18n.description({
                  socialNetworkGroup: capitalizeFirstLetter(selectedNetworkGroup ?? ''),
                  highlight: (content: any) => <b>{content}</b>,
                })}
              </Description>
            </DescriptionContainer>
            <FeatureSelection onSelectFeature={onSelectFeature} onSelectToneFeature={onSelectToneFeature} />
          </CenterColumn>
        </FadeIn>
      </ScrollContainer>
    </Container>
  )
}

export default compose(
  reduxConnect(({ composer }: RootState) => ({
    selectedNetworkGroup: composer.selectedNetworkGroup,
  })),
)(AIPanel)
