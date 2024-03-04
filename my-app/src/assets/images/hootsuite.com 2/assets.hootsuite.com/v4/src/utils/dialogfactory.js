import $ from 'jquery';
import '3rd/jquery-ui';

import domUtils from 'hs-nest/lib/utils/dom-utils';
import translation from 'utils/translation';

/**
 A factory method to make dialog boxes

 Usage:

 var myParams = {
        width: 500,
        height: 300,
        autoOpen: false,
        content: '<ul><li>Alice</li><li>Bob</li></ul>',
        onCreate: function($dialog) { friendsDialog.init($dialog); },
        close: function() { alert('bye!'); }
     };
 var $dialog = $.dialogFactory.create('friends', myParams);

 NOTE: z-indices are automagically set by a provisioning utility

 */

var DialogFactory = function () {
    // for all params, see: http://jqueryui.com/demos/dialog/
    var _defaultParams = {
        autoOpen: true,
        modal: false,
        closeOnEscape: true,
        closeOnOverlayClick: true,
        resizable: false,
        draggable: true,
        isMedia: false,
        isVideo: false,
        minWidth: 300,
        minHeight: 50,
        height: 'auto',
        position: ['center', 50],
    };

    _defaultParams.stack = false;
    _defaultParams.zIndex = domUtils.provisionIndex();

    this.create = function (id, p) {
        var params = $.extend({}, _defaultParams, p),
            isAlreadyOpen = $('#' + id).length > 0,
            $popup = $('<div id="' + id + '" class="_dialog" style="display:none;"></div>'),
            content = params.content ? params.content : null,
            onClose = params.close ? params.close : null;
        var $overlay;

        params.close = null;	// remove close function

        // set popup innerHTML
        if (content) {
            $popup.empty().append(content);
        }

        // append to body and make the div into a jquery dialog
        if (isAlreadyOpen) {
            $('#' + id).dialog('close').remove();
        }

        $('body').append($popup);
        $popup.dialog(params);

        // add in additional classes to the jquery-generated elements
        var $jqdialog = $popup.closest('.ui-dialog');
        var $jqdialogoverlay = {};

        $jqdialog.find('.ui-dialog-titlebar-close').addClass('_close').html('<span class="icon-30 closeButton"></span>');
        $jqdialog.find('.ui-dialog-titlebar-close').attr('aria-label', translation._('Close'))

        // add pre react base classes on modal
        $jqdialog.addClass('rc-ModalBase x-standardModal');
        // add new modal elements for styles to work correctly
        $jqdialog.children().wrapAll('<div class="-modal"><div class="-modalDialog x-default"><div class="-content"></div></div></div>');


        // style code for this class is loaded from hs-nest
        if (hs.isFeatureEnabled('NGE_1058_MODAL_SIZING_LIMIT')) {
            $jqdialog.find('.-modalDialog').addClass('x-dl-rcSizing');
        }

        // add new header classes
        $jqdialog.find('.ui-dialog-titlebar').addClass('-header x-default')

        // replace header title
        $jqdialog.find('.ui-dialog-title').replaceWith(`<h1 class="ui-dialog-title -title" id="ui-dialog-title-${id}">${params.title}</h1>`);

        // add new body classes
        $jqdialog.find('._dialog').addClass('-body');

        // add support for "dialog-less" popups
        if (params.noTitlebar) {
            // note this makes the dialog non-draggable since the titlebar was the handle
            $jqdialog.find('.ui-dialog-titlebar').remove();
        }
        if (params.noChrome) {
            $jqdialog.css({position: 'absolute'}).removeClass('ui-dialog')
                .find('._dialog').removeClass('ui-dialog-content').end()
                .find('.ui-dialog-titlebar').remove();
        }

        if (params.isVideo) {
            var $dialog = $jqdialog.find('._dialog');
            var $videoPlayer = $jqdialog.find('.videoPlayer');
            $dialog.css('padding', 0);
            $dialog.css('margin-top', '-4px');
            $dialog.width($videoPlayer.width());
            $dialog.height($videoPlayer.height());
        }

        // set up and bind close function
        var closeFunction = function () {
            $popup.remove();
            if ($overlay){
                $overlay.remove();
            }
        };
        if ($.isFunction(onClose)) {
            closeFunction = function (event, ui) {
                var result = onClose(event, ui);
                $popup.remove();	// call supplied callback first before removing popup as most close/save actions need info from popup
                if ($overlay){
                    $overlay.remove();
                }
                return result;
            };
        }

        $popup.dialog('option', {close: closeFunction});	// bind close function to dialog

        // call a function on successfully creating dialog
        if (params.onCreate && $.isFunction(params.onCreate)) {
            params.onCreate($popup);		// @TODO: should we use .call() here?
        }

        // the following element is most likely the overlay for this particular dialog
        if ($jqdialog.next().hasClass('ui-widget-overlay') && p.modal === true) {
            $jqdialogoverlay = $jqdialog.next();
            $jqdialogoverlay.addClass('_ui-widget-overlay');

            var overlayClasses = '';
            // Waffowl Easter Egg
            if (hs.waffle) {
                overlayClasses = ' x-waffowl';
            }

            $jqdialogoverlay.removeClass('x-media');
            // class for dark media overlay
            if (params.isMedia) {
                overlayClasses += ' x-media';
            }

            $jqdialogoverlay.addClass(overlayClasses).empty();

            if (params.closeOnOverlayClick) {
                $jqdialogoverlay.on('click', function () {
                    closeFunction();
                });
            }
        }

        var zIndexOffset = p.zIndexOffset || 0;
        var provisionedIndex = domUtils.provisionIndex(zIndexOffset);

        $jqdialog.css('z-index', provisionedIndex);

        if (p.modal === true) {
            $jqdialogoverlay.css('z-index', provisionedIndex - 1);
        }


        // The jquery modal breaks our accessibility controls so we needed to add a custom overlay
        if (params.customOverlay) {
            $overlay = $('<div class="ui-widget-overlay _ui-widget-overlay"></div>');
            $overlay.css('z-index', $jqdialog.css('z-index') - 1);
            $('body').append($overlay);

            $overlay.on('click', function () {
                closeFunction();
            });
        }

        return $popup;
    };
};

var dialogFactory = new DialogFactory();

// attach to jquery (for backward compatibility)
$.dialogFactory = dialogFactory;

export default dialogFactory;

