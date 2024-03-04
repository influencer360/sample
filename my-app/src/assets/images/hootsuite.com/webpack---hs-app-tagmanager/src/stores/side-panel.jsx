'use strict';
var fluxStore = require('hs-nest/lib/utils/wisdom').Store;
var SlideOutPanel = require('hs-nest/lib/components/slide-out-panel/slide-out-panel');
const { SIDE_PANEL_TAG_MANAGER } = require('../actions/types');
class SidePanelStore extends fluxStore {
    constructor(flux) {
        super();
        var actionIds = flux.getActionIds(SIDE_PANEL_TAG_MANAGER);
        this.register(actionIds.setPanelState, this._setPanelState);
        this.register(actionIds.setData, this._setData);
        this.state = {
            panelState: SlideOutPanel.constants.CLOSING
        };
    }
    getPanelState() {
        return this.state.panelState;
    }
    _setPanelState(panelState) {
        this.setState({
            panelState: panelState
        });
    }
}
module.exports = SidePanelStore;
