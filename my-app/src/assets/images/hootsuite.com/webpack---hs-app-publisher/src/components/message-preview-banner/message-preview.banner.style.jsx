/** @format */

import styled from 'styled-components'

const SUB_LABEL_FONT_SIZE = '12px'
const SUB_LABEL_COLOUR = '#5c6365'

const SubLabelContainer = styled.span`
  display: inline-block;
  font-size: ${SUB_LABEL_FONT_SIZE};
  color: ${SUB_LABEL_COLOUR};
`
SubLabelContainer.displayName = 'SubLabelContainer'

const TooltipContainer = styled.div`
  display: inline-block;
  vertical-align: middle;
  margin-left: 4px;
`
TooltipContainer.displayName = 'TooltipContainer'

export { SubLabelContainer, TooltipContainer }
