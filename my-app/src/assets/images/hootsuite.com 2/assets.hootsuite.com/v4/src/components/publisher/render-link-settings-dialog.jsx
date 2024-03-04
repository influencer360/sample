import { publisherFlux as flux } from 'publisher/flux/store';
import trackerDatalab from 'utils/tracker-datalab'
import getHsAppPublisher from 'components/publisher/get-hs-app-publisher'

const renderLinkSettingsDialog = data => {
    getHsAppPublisher().then(({ renderLinkSettingsDialog }) => {
        renderLinkSettingsDialog({
            ...data,
            flux,
            trackerDatalab,
            facadeApiUrl: hs.facadeApiUrl,
            memberId: hs.memberId
        })
    })
}

export default renderLinkSettingsDialog;
