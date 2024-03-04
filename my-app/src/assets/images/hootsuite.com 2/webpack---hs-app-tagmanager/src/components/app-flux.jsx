'use strict';
var wisdom = require('hs-nest/lib/utils/wisdom');
var SidePanelActions = require('../actions/side-panel');
var SidePanelStore = require('../stores/side-panel');
var TagActions = require('../actions/tags');
var TagsStore = require('../stores/tags');
var HeaderActions = require('../actions/header');
var HeaderStore = require('../stores/header');
const { SIDE_PANEL_TAG_MANAGER, TAGS, TAG_HEADER } = require('../actions/types');
class AppFlux extends wisdom.Flux {
    constructor() {
        super();
        this.createActions(SIDE_PANEL_TAG_MANAGER, SidePanelActions);
        this.createStore(SIDE_PANEL_TAG_MANAGER, SidePanelStore, this);
        this.createActions(TAGS, TagActions);
        this.createStore(TAGS, TagsStore, this);
        this.createActions(TAG_HEADER, HeaderActions);
        this.createStore(TAG_HEADER, HeaderStore, this);
    }
}
module.exports = AppFlux;
