import BaseModel from 'utils/backbone/base-model';
import snUtil from '../util';

export default BaseModel.extend({
    idAttribute: 'socialNetworkId',

    requestMap: {
        'delete': '/ajax/network/delete'
    },

    getRequestData: function (method) {
        if (method == 'delete') {
            return {socialNetworkIds: this.id};
        } else {
            return {};
        }
    },

    /**
     * If implemented for the network, gets a larger version of the image to avoid pixelation
     *
     * @see module:core/socialNetwork/util.getOriginalAvatar
     * @returns {*|String}
     */
    getOriginalAvatar: function () {
        return snUtil.getOriginalAvatar(this.get('avatar'));
    },

    /**
     * Get the Social Network type, where the type property is the SocialProfile type
     *
     * @returns {String}
     */
    getNetworkType: function () {
        // If it's a non-standard type we still want to return the value
        return snUtil.getSocialNetworkFromType(this.get('type')) || this.get('type');
    }
});


