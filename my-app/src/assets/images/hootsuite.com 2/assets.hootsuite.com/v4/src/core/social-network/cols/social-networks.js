import Backbone from 'backbone';
import SocialNetwork from 'core/social-network/models/social-network';

export default Backbone.Collection.extend({
    model: SocialNetwork,

    /**
     * We only want to show the user's social networks (not those for an org)
     * @returns {Array<SocialNetworkModel>}
     */
    getMemberAccounts: function () {
        return this.where({
            ownerType: "MEMBER",
            ownerId: hs.memberId
        });
    },

    countMemberAccounts: function () {
        return this.getMemberAccounts().length;
    }
});

