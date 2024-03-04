import React from 'react'
import ReactDOM from 'react-dom'
// fe-global components
import { Popover, WINDOW, RIGHT } from 'fe-comp-popover'
import { A } from 'fe-comp-dom-elements'
import { Button, STANDARD } from 'fe-comp-button'
import styled from 'styled-components'
import Icon from '@fp-icons/icon-base';
import BoxArrowTopRightOutline from '@fp-icons/box-arrow-top-right-outline';
// hs-nest
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import domUtils from 'hs-nest/lib/utils/dom-utils'
import translation from 'hs-nest/lib/utils/translation'
// utils
import hootbus from 'utils/hootbus'

const POPOVER_CONTAINER_ID = '_linkedInComposePopoverContainer'
const POPUP_SEEN_VALUE = 'LINKEDIN_COMPOSE_POPOVER'

const FooterButton = styled(Button)`
    justify-content: center;
    margin-top: 24px;
`

const BodyText = styled.div`
    margin: 8px 0 16px 0;
`

export default {
    hide: () => {
        let popoverContainer = document.querySelector(`#${POPOVER_CONTAINER_ID}`)
        if (popoverContainer) {
            ReactDOM.unmountComponentAtNode(document.querySelector(`#${POPOVER_CONTAINER_ID}`))
        }
    },
    render: (target) => {
        if (document.querySelector(target)) {
            let popoverContainer = document.querySelector(`#${POPOVER_CONTAINER_ID}`)
            if (popoverContainer === null) {
                popoverContainer = document.createElement('div')
                popoverContainer.id = POPOVER_CONTAINER_ID
                popoverContainer.style.zIndex = domUtils.provisionIndex()
                popoverContainer.style.position = 'absolute'
                document.body.appendChild(popoverContainer)
            }

            const closePopover = () => {
                ajaxPromise({
                    method: 'POST',
                    url: '/ajax/member/popup-seen',
                    data: { n: POPUP_SEEN_VALUE }
                }, 'qmNoAbort')
                ReactDOM.unmountComponentAtNode(popoverContainer)
                hs.memberExtras.hasSeenLinkedInComposePopover = true
            }

            const onFooterClick = () => {
                hootbus.emit('composer.open', {});
            }

            const popoverElement = (
                <Popover
                    boundariesElement={WINDOW}
                    closeOnClickOutside
                    hasExitButton
                    heading={translation._('Your followers want to hear from you')}
                    onExitClick={closePopover}
                    popTo={RIGHT}
                    target={target}
                    width={375}
                >
                    <BodyText>
                        {translation._('According to LinkedIn, organizations that post at least once a month generally gain followers six times faster than those that don’t.')}
                    </BodyText>
                    <div>
                        {translation._('Learn more about ')}<br/>
                        <A href="https://www.youtube.com/watch?v=4amoxMS7o1Y" target="_blank" rel="noopener noreferrer">
                            {translation._('Best Practices for Sharing Content on your LinkedIn Page ')}
                            <Icon
                                glyph={BoxArrowTopRightOutline}
                                size={13}
                                fill={'#0078a4'}
                            />
                        </A>
                    </div>
                    <div>
                        <FooterButton type={STANDARD} width={'100%'} onClick={onFooterClick}>
                          {translation._('Post to LinkedIn Company Page')}
                        </FooterButton>
                    </div>
                </Popover>
            )

            ReactDOM.render(
                popoverElement,
                document.getElementById(POPOVER_CONTAINER_ID)
            )
        }
    }
}
