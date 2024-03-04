import React from 'react'

import AltText from '@fp-icons/emblem-alt-text'
import Wand from '@fp-icons/emblem-wand'
import SymbolFlame from '@fp-icons/symbol-flame'
import MinusCircleOutline from '@fp-icons/symbol-minus-circle-outline'
import PlusCircleOutline from '@fp-icons/symbol-plus-circle-outline'
import SparklesIcon from '@fp-icons/symbol-sparkles'
import { useWithI18n } from 'fe-lib-i18n'

import { AI_FEATURES } from '../../constants'
import { FeatureSelectionProps } from '../../types'
import Feature from './Feature'
import { ListContainer } from './FeatureSelection.styles'

const FeatureSelection: React.FC<FeatureSelectionProps> = ({ onSelectFeature, onSelectToneFeature }) => {
  const $i18n = useWithI18n({
    [`${AI_FEATURES.GRAMMAR_CORRECTION}_title`]: 'Fix spelling & grammar',
    [`${AI_FEATURES.GRAMMAR_CORRECTION}_desc`]: 'Avoid spelling and grammar mistakes.',
    [`${AI_FEATURES.MAKE_LONGER}_title`]: 'Make longer',
    [`${AI_FEATURES.MAKE_LONGER}_desc`]: 'Experience writers block? Let’s get you unblocked.',
    [`${AI_FEATURES.MAKE_SHORTER}_title`]: 'Make shorter',
    [`${AI_FEATURES.MAKE_SHORTER}_desc`]: 'Make sure your audience understands your message.',
    [`${AI_FEATURES.TONE_OF_VOICE}_title`]: 'Change tone of voice',
    [`${AI_FEATURES.TONE_OF_VOICE}_desc`]: 'Pick one of the tones to tailor your message to the platform.',
    [`${AI_FEATURES.CALL_TO_ACTION}_title`]: 'Call to action',
    [`${AI_FEATURES.CALL_TO_ACTION}_desc`]: 'Make your message actionable.',
  })

  const getIcon = (feature: string) => {
    switch (feature) {
      case AI_FEATURES.GRAMMAR_CORRECTION:
        return Wand
      case AI_FEATURES.MAKE_LONGER:
        return PlusCircleOutline
      case AI_FEATURES.MAKE_SHORTER:
        return MinusCircleOutline
      case AI_FEATURES.TONE_OF_VOICE:
        return AltText
      case AI_FEATURES.CALL_TO_ACTION:
        return SymbolFlame
      default:
        return SparklesIcon
    }
  }

  const getEventHandler = (feature: string) => {
    return feature === AI_FEATURES.TONE_OF_VOICE ? onSelectToneFeature : () => onSelectFeature(feature)
  }

  return (
    <ListContainer>
      {Object.values(AI_FEATURES).map((feature: string) => (
        <Feature
          key={feature}
          title={$i18n[`${feature}_title`]()}
          description={$i18n[`${feature}_desc`]()}
          iconGlyph={getIcon(feature)}
          onSelect={getEventHandler(feature)}
        />
      ))}
    </ListContainer>
  )
}

export default FeatureSelection
