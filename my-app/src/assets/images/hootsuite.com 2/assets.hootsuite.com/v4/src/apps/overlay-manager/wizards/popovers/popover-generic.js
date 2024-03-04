import _ from 'underscore';
import React from 'react';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import {stepPopoverModule} from '../walkthroughs/step-popover'
import Popover from 'hs-nest/lib/components/popovers/popover';
import AppBase from 'core/app-base';

export default AppBase.extend({

    initialize: function (params) {

        var props = _.pick(
            params,
            'content',
            'followTarget',
            'hideOnClickSelectors',
            'messageEvents',
            'onRequestHide',
            'popoverName',
            'popoverProps',
            'popoverType',
            'targetElementClass',
            'tetherOptions',
            'tracking'
        );

        _.extend(this, props);
        _.extend(this.messageEvents, this._messageEvents); // needs to be done before calling app base initialize

        this.popover = Object.create(stepPopoverModule);

        AppBase.prototype.initialize.apply(this, _.toArray(arguments));
    },

    _messageEvents: {
        'popover:generic:close': 'hide'
    },

    // default props
    content: {},
    followTarget: false,
    messageEvents: {},
    popoverProps: {},
    targetElementClass: '',
    tetherOptions: {},
    tracking: {},
    popoverName: '',
    popoverType: 'onboarding',
    hideOnClickSelectors: '',
    $hideOnClickElements: [],

    show: function () {
        var $targetElement = document.querySelectorAll(this.targetElementClass);

        if ($targetElement.length) {
            var tetherOptions = {
                attachment: 'top center',
                targetAttachment: 'bottom center',
                offset: '0 0'
            };
            _.extend(tetherOptions, this.tetherOptions);
            var defaultProps = {
                hasCloseButton: true,
                onRequestHide: this.hide.bind(this),
                popoverType: this.popoverType,
                className: "_popoverGeneric"
            };
            _.extend(defaultProps, this.popoverProps);

            var props = _.extend({}, this.content, defaultProps, this.popoverProps);

            this.popover.open(document.querySelector(this.targetElementClass), React.createElement(Popover, props), tetherOptions);

            if (this.followTarget) {
                this.popover.startFollowingTarget();
            }
            this.attachEvents();
        } else {
            // target element does not exist?
            this.hide();
        }

    },

    attachEvents: function () {
        if (this.hideOnClickSelectors) {
            this.$hideOnClickElements = document.querySelector(this.hideOnClickSelectors);
            this.$hideOnClickElements.addEventListener('click.genericPopover', this.hide.bind(this));
        }
    },

    removeEvents: function () {
        if (this.$hideOnClickElements.length) {
            this.$hideOnClickElements.removeEventListner('click.genericPopover');
        }
    },

    trackPopoverSeen: function () {
        if (this.tracking.action && this.tracking.origin) {
            trackerDatalab.trackCustom(this.tracking.origin, this.tracking.action);
        }
        if (this.popoverName) {
            ajaxCall({
                url: '/ajax/member/popup-seen',
                data: {
                    n: this.popoverName,
                    a: 'close'
                },
                type: 'POST'
            }, 'qm');
        }
    },

    hide: function () {
        //cleanup
        if (this.followTarget) {
            this.popover.stopFollowingTarget();
        }
        this.removeEvents();

        // tracking
        this.trackPopoverSeen();

        hootbus.emit('notify:overlay:closed', 'popover', 'popoverGeneric');

        this.popover.close();
        this.destroy();
    }
});
