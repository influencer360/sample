import TetheredElement from 'hs-nest/lib/utils/tethered-element';
import _ from 'underscore';

export const stepPopoverModule = {

    /**
     * Attach a React Element to the given target with Tether
     *
     * @param {string|Node} anchor target for attachment
     * @param {Element} reactElement the element to attach with Tether
     * @param {object} params Tether params to override the default ones
     */
    open: function (anchor, reactElement, params) {
        var $anchor = $(anchor);

        if ($anchor.length === 0) {
            return;
        }

        this.close();

        //Prepare the tether param
        var defaultParams = {
            target: anchor,
            attachment: 'top right',
            targetAttachment: 'top left',
            offset: '12px 0',
            constraints: [
                {
                    to: 'window'
                }
            ]
        };

        params = _.extend(defaultParams, params || {});

        //Tether the popup to the anchor element
        this.addTetheredElement(reactElement, params);

        // Determine how the element is attached to the target
        var parts = params.attachment.split(' ');
        var attachmentParts = {vertical: parts[0], horizontal: parts[1]};
        parts = params.targetAttachment.split(' ');
        var targetAttachmentParts = {vertical: parts[0], horizontal: parts[1]};

        var tetheredElementWidth = $(this.getTetheredElementRef()).outerWidth(); // We need to render the element to calculate its width

        // If we're not tethering the element on the same side as the target (or centering the element)
        if (attachmentParts.horizontal !== targetAttachmentParts.horizontal && attachmentParts.horizontal !== 'center') {
            var offsetParts = params.offset.split(' ');

            // Swap attachment side if there's not enough room for the tethered element
            if (attachmentParts.horizontal === 'left' && $(window).innerWidth() < ($anchor.offset().left + $anchor.outerWidth() + tetheredElementWidth)) {
                params.attachment = this.switchAttachmentSides(params.attachment, 'right');
                params.targetAttachment = this.switchAttachmentSides(params.targetAttachment, 'left');

                // Update the horizontal offset
                params.offset = offsetParts[0] + ' ' + this.switchOffsetSides(offsetParts[1]);

                // Remove the previously rendered tethered element
                this.tetheredElement.destroy();

                // Add the updated tethered element
                this.addTetheredElement(reactElement, params);
            } else if (attachmentParts.horizontal === 'right' && tetheredElementWidth > $anchor.offset().left) {
                params.attachment = this.switchAttachmentSides(params.attachment, 'left');
                params.targetAttachment = this.switchAttachmentSides(params.targetAttachment, 'right');

                // Update the horizontal offset
                params.offset = offsetParts[0] + ' ' + this.switchOffsetSides(offsetParts[1]);

                // Remove the previously rendered tethered element
                this.tetheredElement.destroy();

                // Add the updated tethered element
                this.addTetheredElement(reactElement, params);
            }
        }
    },

    addTetheredElement: function (reactElement, params) {
        this.tetheredElement = new TetheredElement(reactElement, params);
    },

    getTetheredElementRef: function () {
        return this.tetheredElement.element;
    },

    /**
     * Used to change the horizontal offset
     *
     * @param currentHorizontalOffset
     */
    switchOffsetSides: function (currentHorizontalOffset) {
        if (currentHorizontalOffset === '0') { return currentHorizontalOffset; }

        if (parseInt(currentHorizontalOffset, 10) < 0) {
            // Remove the negative sign
            return currentHorizontalOffset.substr(1);
        } else {
            return '-' + currentHorizontalOffset;
        }
    },

    /**
     * Used to change which side the WalkthroughStep will show.
     * Will ONLY change if the currentAttachment is left or right)
     *
     * @param {string} currentAttachment
     * @param newSide
     * @returns {*}
     */
    switchAttachmentSides: function (currentAttachment, newSide) {
        var attachmentPoints = currentAttachment.split(' ');
        if (attachmentPoints.length === 2 &&
            this.isValidSideAttachment(attachmentPoints[1]) &&
            this.isValidSideAttachment(newSide)) {
            attachmentPoints[1] = newSide;
            return attachmentPoints.join(' ');
        }

        return currentAttachment;
    },

    isValidSideAttachment: function (sideAttachment) {
        return ['left', 'right'].indexOf(sideAttachment) >= 0;
    },

    /**
     * Use to reposition a tether element during an animation
     * !! expensive operation so be sure to call #stopFollowingTarget !!
     */
    startFollowingTarget: function () {
        this.tetheredElement && this.tetheredElement.startFollowingTarget();
    },

    /**
     * Stops the interval calls to reposition the tethered element
     */
    stopFollowingTarget: function () {
        this.tetheredElement && this.tetheredElement.stopFollowingTarget();
    },

    /**
     * Closes the current popup.
     */
    close: function () {
        if (this.tetheredElement) {
            this.tetheredElement.destroy();
            this.tetheredElement = null;
        }
    },

    /**
     * Returns whether the popup is currently open.
     */
    isOpen: function () {
        return !!this.tetheredElement;
    },

    /**
     * Cleanup any event listeners, object instances, etc.
     */
    destroy: function () {
        this.close();
    }
};
export const popoverArrowDefaultPosition = -1;
