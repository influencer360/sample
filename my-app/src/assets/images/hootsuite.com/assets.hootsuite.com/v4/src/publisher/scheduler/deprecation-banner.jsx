import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Banner, TYPE_WARNING } from 'fe-comp-banner'
import { A } from 'fe-comp-dom-elements'
import translation from 'utils/translation'

const LEGACY_VIEWS_DEPRECATION_BANNER_ID = 'legacyViewsDeprecationBanner'
const SCHEDULER_SECTION_ID = 'schedulerSection'
const HEADER_TOP_CLASSNAME = '_headerTop'

const VIEWS = {
    SCHEDULED: 'scheduled',
    PAST_SCHEDULED: 'pastscheduled',
    REQUIRE_MY_APPROVAL: 'approvequeue',
    PENDING_APPROVAL: 'pendingapproval',
    EXPIRED: 'expired',
    REJECTED: 'rejected',
}

const SCHEDULED_TITLE_TEXT = translation._('Scheduled content changes coming March 31, 2024')
const SCHEDULED_MESSAGE_TEXT = translation._("Since all scheduled content has a new home in the Calendar tab, we'll be removing this view on March 31, 2024.")
const SCHEDULED_LEARN_MORE_TEXT = translation._('Learn more about managing scheduled content')
const SCHEDULED_LINK = 'https://help.hootsuite.com/hc/en-us/articles/1260804306009#h_01HKZ9TK11RY74Q174H3DM3595'
const APPROVALS_TITLE_TEXT = translation._('Content approval changes coming March 31, 2024')
const APPROVALS_MESSAGE_TEXT = translation._("Since content approvals have a new home in the Calendar tab, we'll be removing this view on March 31, 2024.")
const APPROVALS_LEARN_MORE_TEXT = translation._('Learn more about the new Approvals experience')
const APPROVALS_LINK = 'https://help.hootsuite.com/hc/en-us/articles/1260804251650'

const DeprecationBanner = ({ section }) => {
    const handleHashChange = () => {
        if (window.location.hash.indexOf('#/publisher') === -1) {
            window.hasClosedLegacyViewsDeprecationBanner = {
                [VIEWS.SCHEDULED]: false,
                [VIEWS.PAST_SCHEDULED]: false,
                [VIEWS.REQUIRE_MY_APPROVAL]: false,
                [VIEWS.PENDING_APPROVAL]: false,
                [VIEWS.EXPIRED]: false,
                [VIEWS.REJECTED]: false,
            }
        }
    }

    useEffect(() => {
        window.addEventListener('hashchange', handleHashChange)
        return () => {
            window.removeEventListener('hashchange', handleHashChange)
        }
    }, [])

    let titleText
    let messageText
    let learnMoreText
    let link

    switch (section) {
        case VIEWS.SCHEDULED:
        case VIEWS.PAST_SCHEDULED: {
            titleText = SCHEDULED_TITLE_TEXT
            messageText = SCHEDULED_MESSAGE_TEXT
            learnMoreText = SCHEDULED_LEARN_MORE_TEXT
            link = SCHEDULED_LINK
            break
        }
        case VIEWS.REQUIRE_MY_APPROVAL:
        case VIEWS.PENDING_APPROVAL:
        case VIEWS.EXPIRED:
        case VIEWS.REJECTED: {
            titleText = APPROVALS_TITLE_TEXT
            messageText = APPROVALS_MESSAGE_TEXT
            learnMoreText = APPROVALS_LEARN_MORE_TEXT
            link = APPROVALS_LINK
            break
        }
        default:
            break
    }

    if (messageText && titleText && learnMoreText && link) {
        const learnMoreLink = <A rel="noopener noreferrer" target="_blank" href={link}>{learnMoreText}</A>
        return (
            <Banner
                closeAction={() => {
                    const container = document.getElementById(LEGACY_VIEWS_DEPRECATION_BANNER_ID)
                    if (container) {
                        ReactDOM.unmountComponentAtNode(container)
                        scheduler.setHeight()
                        window.hasClosedLegacyViewsDeprecationBanner = {
                            ...window.hasClosedLegacyViewsDeprecationBanner,
                            [section]: true,
                        }
                    }
                }}
                messageText={<span>{messageText} {learnMoreLink}</span>}
                titleText={titleText}
                type={TYPE_WARNING}
            />
        )
    }
    return null
}

export const renderDeprecationBanner = (section) => {
    if (window.hasClosedLegacyViewsDeprecationBanner?.[section]) return
    let container = document.getElementById(LEGACY_VIEWS_DEPRECATION_BANNER_ID)
    if (!container) {
        container = document.createElement('div')
        container.id = LEGACY_VIEWS_DEPRECATION_BANNER_ID
        container.className = HEADER_TOP_CLASSNAME // Needed for scheduler.setHeight() calculation
        document.querySelector(`#${SCHEDULER_SECTION_ID}`)?.prepend(container)
    }
    ReactDOM.render(<DeprecationBanner section={section} />, container)
    setTimeout(() => scheduler.setHeight(), 0)
}
