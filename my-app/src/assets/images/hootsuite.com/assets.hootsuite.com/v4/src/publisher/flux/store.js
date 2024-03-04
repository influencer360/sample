import flux from "hs-nest/lib/stores/flux";
import getHsAppPublisher from "components/publisher/get-hs-app-publisher";
import {
    PRESETS,
    APPROVER,
    APPROVER_SEARCH_RESULT,
    CAMPAIGNS,
    YOUTUBE,
    LINK_SHORTENERS,
} from "./actions";

export const publisherFlux = flux;
export const asyncPublisherFlux = new Promise((resolve) => {
    getHsAppPublisher().then(
        ({
            PresetsActions,
            PresetsStore,
            ApproverStore,
            ApproverActions,
            ApproverSearchResultStore,
            CampaignsActions,
            CampaignsStore,
            YouTubeStore,
            YouTubeActions,
            LinkShortenersStore,
            LinkShortenersActions,
        }) => {
            publisherFlux.createActions(PRESETS, PresetsActions, publisherFlux);
            publisherFlux.createStore(PRESETS, PresetsStore, publisherFlux);

            publisherFlux.createActions(
                APPROVER,
                ApproverActions,
                publisherFlux
            );
            publisherFlux.createStore(APPROVER, ApproverStore, publisherFlux);
            publisherFlux.createStore(
                APPROVER_SEARCH_RESULT,
                ApproverSearchResultStore,
                publisherFlux
            );

            publisherFlux.createActions(
                CAMPAIGNS,
                CampaignsActions,
                publisherFlux
            );
            publisherFlux.createStore(CAMPAIGNS, CampaignsStore, publisherFlux);

            publisherFlux.createActions(
                LINK_SHORTENERS,
                LinkShortenersActions,
                publisherFlux
            );
            publisherFlux.createStore(
                LINK_SHORTENERS,
                LinkShortenersStore,
                publisherFlux
            );

            publisherFlux.createActions(YOUTUBE, YouTubeActions);
            publisherFlux.createStore(YOUTUBE, YouTubeStore, publisherFlux);

            resolve(publisherFlux);
        }
    );
});
