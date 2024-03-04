// TODO: Move this component to the plancreate namespace when Planner supports dynamic imports

import React from 'react'
import styled from 'styled-components'
import { BouncingBars } from 'fe-comp-loader'
import { venk } from 'fe-hoc-venkman'

const LoaderContainer = venk(
  styled.div`
    position: ${p => (p.isAbsolutePositioned ? 'absolute' : 'relative')};
    width: ${p => p.width};
    height: ${p => p.height};
    max-width: ${p => p.maxWidth};
    background-color: ${p => p.backgroundColour};
    ${p => p.isAbsolutePositioned && 'z-index: 1;'};
  `,
  'Loader',
)
LoaderContainer.displayName = 'LoaderContainer'

export const Loader = ({
  backgroundColour = '#fff',
  bouncingBarColour = null,
  height = '100%',
  isAbsolutePositioned = true,
  width = '100%',
  maxWidth = '100%',
}) => (
  <LoaderContainer {...{ backgroundColour, height, isAbsolutePositioned, width, maxWidth }}>
    {bouncingBarColour ? <BouncingBars fill={bouncingBarColour} /> : <BouncingBars />}
  </LoaderContainer>
)
