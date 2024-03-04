import React from 'react'

import Icon from '@fp-icons/icon-base'
import { H3 } from 'fe-comp-dom-elements'
import { getThemeValue } from 'fe-lib-theme'

import { FeatureProps } from '../../types'
import { FeatureContainer, FeatureDescription, IconContainer, ListItem } from './Feature.styles'

const Feature: React.FC<FeatureProps> = ({ title, description, iconGlyph, onSelect }) => (
  <ListItem aria-label={title} onClick={onSelect}>
    <FeatureContainer>
      <IconContainer>
        <Icon fill={getThemeValue(t => t.colors.primary)} glyph={iconGlyph} size={16} />
      </IconContainer>
      <div>
        <H3>{title}</H3>
        {description && <FeatureDescription>{description}</FeatureDescription>}
      </div>
    </FeatureContainer>
  </ListItem>
)

export default Feature
