'use strict';

import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';

class AdAccountsApiService {
  constructor() {
    this.facadeApiUrl = hs.facadeApiUrl;
  }

  getExternalAdAccountsPromise(socialNetworkId) {
    return ajaxPromise({
      type: 'GET',
      urlRoot: this.facadeApiUrl,
      url: `/ad-accounts/external/ad-accounts?social_profile_ids=${socialNetworkId}`,
      jwt: true
    });
  }

  getSocialProfilePermissionsPromise(socialNetworkId) {
    return ajaxPromise({
      type: 'GET',
      urlRoot: this.facadeApiUrl,
      url: `/ad-accounts/social-profiles/permissions?social_profile_ids=${socialNetworkId}`,
      jwt: true
    });
  }

  getAdAccountsPromise(socialNetworkId) {
    return ajaxPromise({
      type: 'GET',
      urlRoot: this.facadeApiUrl,
      url: `/ad-accounts/social-profiles/${socialNetworkId}/ad-accounts`,
      jwt: true
    });
  }

  getMemberPermissionsPromise(memberId, socialNetworkId) {
    return ajaxPromise({
      type: 'GET',
      urlRoot: this.facadeApiUrl,
      url: `/organization/memberPermissions?memberId=${memberId}&socialProfileId=${socialNetworkId}`,
      jwt: true
    }); 
  }

  removeAdAccountPromise(socialNetworkId, adAccountId) {
    return ajaxPromise({
      type: 'DELETE',
      urlRoot: this.facadeApiUrl,
      url: `/ad-accounts/social-profiles/${socialNetworkId}/ad-accounts/${adAccountId}`,
      jwt: true
    });
  }
}

export default new AdAccountsApiService();
