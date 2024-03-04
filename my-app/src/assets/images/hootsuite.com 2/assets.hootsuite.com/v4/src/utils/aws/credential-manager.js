import _ from 'underscore';

const host = hs.util.getUrlRoot()
var ACCESS_TOKENS_ENDPOINT = `${host}/ajax/event-tracking/access-tokens`;

var refreshCredentials = function () {
    // Fetch credentials
    return fetch(ACCESS_TOKENS_ENDPOINT, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(r => {
        if (!r.ok) {
            throw new Error('No credentials in response')
        }
        return r.json()
    }).then(response => {
        if (!response.accessTokens) {
            throw new Error('No credentials in response')
        }

        /**
         * A container for a set of IAM credentials.
         * @typedef {Object} Credentials
         * @property {string} accessKeyId Access Key ID portion of an Amazon IAM credential set
         * @property {string} secretAccessKey The secret key
         * @property {string} sessionToken An auxiliary identifier for temporary credentials.
         */
        return {
            accessKeyId: response.accessTokens.key,
            secretAccessKey: response.accessTokens.secret,
            sessionToken: response.accessTokens.token
        };

    })
};

function CredentialManager() {
    this.pCredentials = null;
}

_.extend(CredentialManager.prototype, {
    /**
     * If credentials fail, use this method to mark them invalid.
     */
    markCredentialsInvalid: function () {
        this.pCredentials = null;
    },
    /**
     * Get a promise of the current credentials. Will fetch new credentials if none are active.
     * @returns {Promise<Credentials>}
     */
    getCredentials: function () {
        if (this.pCredentials === null) {
            this.pCredentials = refreshCredentials();
        }

        return this.pCredentials;
    }
});

export default new CredentialManager();
