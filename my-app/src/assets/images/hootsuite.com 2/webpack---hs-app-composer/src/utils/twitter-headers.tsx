// This file should be deleted once the output of this spike is complete: https://hootsuite.atlassian.net/browse/PUB-30981
// This spike is for a long term solution; the utils in this file are a short term solution

type LegacyBaggage = {
  baggage?: string
  'baggage-platform': string
  'baggage-product': string
}

/**
 * Generates baggage headers compatible with fetch based APIs.
 * This will be replaced by a more standard and extensible version after https://hootsuite.atlassian.net/browse/PUB-30981
 * Please discuss with #pub-ferrix before extending or re-using this
 * @example
 *  axios.get(myUrl, {headers: twitterBaggageHeaders()})
 * @example
 *  fetch(myUrl, {method: "GET", headers: twitterBaggageHeaders()})
 * @returns LegacyBaggage
 */
export function twitterBaggageHeaders(): LegacyBaggage {
  return {
    baggage: 'product=composer, platform=web',
    'baggage-platform': 'WEB',
    'baggage-product': 'COMPOSER',
  }
}
