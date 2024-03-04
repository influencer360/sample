import $ from 'jquery';
import _ from 'underscore';
import darklaunch from './darklaunch';
import hootbus from 'hs-nest/lib/utils/hootbus';

/**
 * Status message object
 * - really simple right now, holds one message and it's config info
 * - to change the status call update: pass in type (error, warning, success) and the message content
 * - to clear the status/set to defaults call reset
 * - error messages stay up with a close button, others close after 6 seconds on their own
 * @constructor
 */
function StatusObject() {
    var _this = this;

    this.defaultHideTimeout = darklaunch.isFeatureEnabled('CUXF_INCREASE_TOAST_TIME') ? 6000 : 5000;
    this.errorClass = "error";
    this.warningClass = "warning";
    this.successClass = "success";
    this.infoClass = "info";

    this.animationClass = "animated bounceIn";
    // status message types that have to be animated
    this.animatedTypes = ["error", "warning", "success"];

    this.messageContent = "";
    this.type = "info";
    this.isAutoHide = false;
    this.hideTimeout = this.defaultHideTimeout;
    this.timeoutRef = null;
    this.persist = false;
    this.selector = "#statusContainer";
    this.disabled = false;

    this.disable = function () {
        this.disabled = true;
        $(this.selector).hide();
    };

    this.enable = function () {
        this.disabled = false;
    };
    /**
     * @param {String}  message     mess
     * @param {String}  type        one of: error, warning, success, info
     * @param {Boolean} isAutoHide  whether to auto-hide after default delay
     * @param {Number}  hideTimeout specify the timeout length
     * @param {Boolean} persist     this message sticks around and has priority
     * #param (String) selector     Jquery selector for status message container (defaults to "#statusContainer")
     */
    this.update = function (message, type, isAutoHide, hideTimeout, persist, selector) {
        // If the status object is disabled don't update then don't update the message
        if (this.disabled) {
            return;
        }

        // If there's a persistent message up, ignore any new messages
        if (this.persist) {
            return;
        }

        if (persist === undefined) {
            persist = false;
            this.persist = false;
        }

        if (type) {
            this.type = type;
        }
        if (isAutoHide) {
            this.isAutoHide = isAutoHide;
        }
        if (hideTimeout) {
            this.hideTimeout = hideTimeout;
        }

        this.messageContent = message;

        if (persist) {
            this.persist = true;
            this.isAutoHide = true;
        }

        if (selector) {
            this.selector = selector;
        } else {
            this.selector = "#statusContainer";
        }

        var classToAdd = this[this.type + "Class"];
        if (_.contains(this.animatedTypes, this.type)) {
            classToAdd += ' ' + this.animationClass;
        }

        var publishHandler = function (ev) {
            // status object clicked
            // now check ev.target
            var $target = $(ev.target),
                data = $target.data();

            switch (data.action) {
                case 'recoverStream':
                    hootbus.emit('statusObject:extraAction:recoverStream');
                    break;
                case 'internalLink':
                    hootbus.emit('statusObject:extraAction:internalLink', data.url);
                    break;
            }
            return false;
        };

        $(this.selector)
            .attr('role', 'alert')
            .attr('aria-live', 'polite')
            .find("._statusMsgContent").empty().html(this.messageContent)
            .end()
            .find("div")
            .removeClass(this.errorClass + ' ' + this.warningClass + ' ' + this.successClass + ' ' + this.infoClass + ' ' + this.animationClass)
            .addClass(classToAdd)
            .end()
            .show()
            .bind('click', function (e) {
                if ($(e.target).is('._extraAction')) {
                    publishHandler(e);
                }
                if (e.target.tagName != 'A') {
                    e.preventDefault();
                }
                if (_this.timeoutRef) {
                    clearTimeout(_this.timeoutRef);
                }
                _this.reset();
            })
            .find(".icon-13").hide();

        $(this.selector)
            .find("._statusMessage")
            .addClass("relativeClose")
            .removeClass("hasClose");

        // show close button if longer than default display time; can't use show() here
        if (hideTimeout > this.defaultHideTimeout) {
            $(this.selector).find(".icon-13").css("display", "inline-block");
            $(this.selector).find("._statusMessage").addClass("hasClose");
        }

        if (this.isAutoHide === true) {
            if (_this.timeoutRef) {
                clearTimeout(_this.timeoutRef);
            }
            _this.timeoutRef = setTimeout(function () {
                _this.complete();
                _this.reset();
            }, this.hideTimeout);
        }
    };

    this.complete = function () {
        this.persist = false;
    };

    this.reset = function () {
        if (this.persist) {
            return;
        }

        $(this.selector)
            .hide()
            .removeAttr('role')
            .removeAttr('aria-live')
            .find("div").removeClass(this.errorClass + ' ' + this.warningClass + ' ' + this.successClass + ' ' + this.infoClass + ' ' + this.animationClass).end()
            .find("._statusMsgContent").empty().end()
            .stop()
            .unbind('click')
            .find(".icon-13").hide();

        $(this.selector)
            .find("._statusMessage")
            .removeClass("hasClose");

        this.messageContent = "";
        this.type = "info";
        this.isAutoHide = false;
        this.hideTimeout = this.defaultHideTimeout;
        this.timeoutRef = null;
        this.selector = "#statusContainer";
    };
}
// instantiate it
var inst = new StatusObject();

hs.statusObj = inst;

hootbus.on('status:success', function (data) {
    if (data.autoHideAfter) {
        data.autoHide = true;
    }
    hs.statusObj.update(data.message, 'success', data.autoHide, data.autoHideAfter, data.persist, data.selector);
});

hootbus.on('status:error', function (data) {
    hs.statusObj.update(data.message, 'error',  data.autoHide, data.autoHideAfter, data.persist, data.selector);
});

hootbus.on('status:info', function (data) {
    if (data.autoHideAfter) {
        data.autoHide = true;
    }
    hs.statusObj.update(data.message, 'info',  data.autoHide, data.autoHideAfter, data.persist, data.selector);
});

hootbus.on('status:warning', function (data) {
    if (data.autoHideAfter) {
        data.autoHide = true;
    }
    hs.statusObj.update(data.message, 'warning',  data.autoHide, data.autoHideAfter, data.persist, data.selector);
});

hootbus.on('status:reset', function () {
    hs.statusObj.reset();
});

export default inst;
