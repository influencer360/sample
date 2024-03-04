import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import AbortionError from 'hs-nest/lib/error/abortion-error';

import trackerDataLab from 'utils/tracker-datalab';
import translation from 'utils/translation';

import baseFlux from 'hs-nest/lib/stores/flux';
import {
  ORGANIZATIONS
} from 'hs-nest/lib/actions';

import address from 'address';

import { DashboardHeaderWrapper, mount as dashboardHeaderMount } from 'components/dashboard-header-wrapper'

import styled from  'styled-components';

import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { setSelectedOrganization } from 'fe-pnc-data-organizations';
import { setOrganizations } from 'components/publisher/utils/organization-utils';

const track = (action, data) => {
    const TRACKING_ORIGIN = 'web.dashboard.publisher_entry_point';

    trackerDataLab.trackCustom(TRACKING_ORIGIN, action, data);
};

const PUBLISHER_HEADER_ID = 'publisherHeader';

const TRACKING_ACTIONS = {
    TABS: {
        CLICK_PLANNER: 'click_planner',
        CLICK_CONTENT: 'click_content',
        CLICK_PROMOTE: 'click_promote'
    }
};

export const mount = (startingTab) => dashboardHeaderMount(PUBLISHER_HEADER_ID, PublisherHeader, { startingTab });
export const unmount = () => {
    const publisherHeader = document.querySelector(`#${PUBLISHER_HEADER_ID}`);
    if (publisherHeader) {
        ReactDOM.unmountComponentAtNode(publisherHeader)
    }
};

const HeaderWrapper = withHsTheme(styled.div`
    display: flex;
    align-items: center;
    background: ${() => getThemeValue(t => t.colors.masthead.background)};
    padding-left: ${() => getThemeValue(t => t.spacing.spacing20)};
    border-bottom: solid 1px ${() => getThemeValue(t => t.colors.darkGrey20)};
`)

const Title = withHsTheme(styled.h1`
    &&& { /* Neede to override global header styling */
        flex: 0 0 auto;
        font-size: ${() => getThemeValue(t => t.typography.sectionTitle.size)};
        font-weight: ${() => getThemeValue(t => t.typography.sectionTitle.weight)};
        color: ${() => getThemeValue(t => t.colors.darkGrey)};
        margin: 0;
    }
`)

const Separator = withHsTheme(styled.div`
    flex: 0 0 auto;
    background: ${() => getThemeValue(t => t.colors.darkGrey60)};
    height: ${() => getThemeValue(t => t.spacing.spacing20)};
    width: 1px;
    margin: 0 ${() => getThemeValue(t => t.spacing.spacing16)};
`)

class PublisherHeader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeTab: props.startingTab,
        };
    }

    componentDidMount() {
        const getOrganizations = new Promise((resolve) => {
            const organizationsStore = baseFlux.getStore(ORGANIZATIONS);
            let organizations = organizationsStore.getSortedByOwner(hs.memberId);

            if (organizations && Object.keys(organizations).length) {
                resolve(organizations);
            } else {
                baseFlux.getActions(ORGANIZATIONS).fetch(true).then(function () {
                    organizations = organizationsStore.getSortedByOwner(hs.memberId);
                    resolve(organizations);
                }).catch(function (e) {
                    if (!AbortionError.isAbortionError(e)) {
                        hs.statusObj.update(translation._('Unable to retrieve organizations'), 'error', true);
                    }
                });
            }
        });

        getOrganizations.then((organizations) => {
            const organizationsStore = baseFlux.getStore(ORGANIZATIONS);

            setOrganizations(organizations);

            if (typeof window !== 'undefined' && !window.localStorage) {
                setSelectedOrganization(organizationsStore.getSelectedOrganization());
            }
        });
    }

    getTabs() {
        const { activeTab } = this.state;

        const setActiveTab = tab => {
          this.setState({ activeTab: tab })
        };

        const tabs = [
            {
                label: translation._('Calendar'),
                value: 'planner',
                dapTarget: 'planner-calendar-tab',
                onClick: () => {
                    track(TRACKING_ACTIONS.TABS.CLICK_PLANNER);
                    address.go('/planner');
                    setActiveTab('planner');
                }
            },
            {
                label: translation._('Content'),
                value: 'publisher',
                onClick: () => {
                    track(TRACKING_ACTIONS.TABS.CLICK_CONTENT);
                    address.go('/publisher/scheduled');
                    setActiveTab('publisher');
                }
            }
        ];

        return tabs.map(tab => Object.assign(tab, {active: tab.value === activeTab}))
    }

    getOrgs() {
        const { organizations, selectedOrganization } = this.props;

        return organizations.map(org => ({
            active: typeof selectedOrganization === 'object' && selectedOrganization.organizationId === org.organizationId,
            label: org.name,
            image: {
                src: org.logo,
            },
            onClick: () => {
                setSelectedOrganization(org)
            }
        }))
    }

    getFeedbackKey() {
        const { activeTab } = this.state;

        const tabToFeedbackKey = {
            planner: 'Content Planner',
            publisher: 'publisher_content',
        };

        return tabToFeedbackKey[activeTab]
    }

    render () {
        const { unmount } = this.props;

        const globalHeaderProps = {
            title: {
                label: translation._("Planner"),
                glyph: "LogoHootsuitePublisher",
            },
            includes: {
                composer: this.props.canAccessComposer,
            },
            tabs: this.getTabs(),
            orgSelect: this.getOrgs(),
            feedbackKey: this.getFeedbackKey(),
        };
        const dashboardHeaderProps = { sections: ['publisher'] };
        const props = Object.assign({unmount}, dashboardHeaderProps, globalHeaderProps);

        return (
            <HeaderWrapper>
                <Title>{ translation._("Planner")}</Title>
                <Separator />
                <DashboardHeaderWrapper {...props} />
            </HeaderWrapper>


    );
    }
}

PublisherHeader.propTypes = {
    organizations: PropTypes.arrayOf(PropTypes.object),
    selectedOrganization: PropTypes.object,
    startingTab: PropTypes.string.isRequired,
    unmount: PropTypes.func.isRequired,
    canAccessComposer: PropTypes.bool,
};

PublisherHeader.defaultProps = {
    organizations: [],
    setOrganizations: null,
};
