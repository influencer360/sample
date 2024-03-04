/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import escapeRegExp from 'lodash.escaperegexp'
import cloneDeep from 'lodash.clonedeep'
import isEqual from 'lodash.isequal'
import omit from 'lodash.omit'
import Constants from '../constants/constants'
import ConstantMappings from '../constants/constant-mappings'
import findIndex from 'lodash.findindex'

const LinkSettingsUtils = {
  /**
   * Takes in original message text with raw links, and link settings, and returns message text with shortened links
   * @param {string} msgText A string with the original message text
   * @param {object} linkSettings An object containing the link setting information detected in the message
   * @returns {string} message Final message text with shortened links (ow.ly, bit.ly etc) instead of raw links
   */
  replaceLinksWithShortenedLinks(msgText, linkSettings) {
    let message = msgText
    _.map(linkSettings, linkSetting => {
      if (linkSetting.linkShortenerId !== Constants.LINK_SHORTENER.NONE) {
        let regex = RegExp(escapeRegExp(linkSetting.url), '')
        message = message.replace(regex, linkSetting.previouslyComputedLink.shortenedUrl)
      }
    })
    return message
  },

  /**
   * Takes a message text and link settings, and returns a template where links in the message text have been replaced by markup in the format of %{link-setting-id:id#}
   * @param {string} message A string of the message text
   * @param {object} linkSettings An object representing the link settings detected in the message
   * @returns {string} template Returns a template where links in the message text have been replaced by markup in the format of %{link-setting-id:id#}
   */
  setTemplateForLinkSettings(message, linkSettings) {
    let template = message
    _.each(linkSettings, (linkSetting, index) => {
      let regex = RegExp(escapeRegExp(linkSetting.url), '')
      template = template.replace(regex, `%{link-setting-id:${index}}`)
    })
    return template
  },

  /**
   * Takes in a link setting with front-end display friendly values and converts the values to back-end friendly values
   * @param {object} linkSetting with front-end display friendly values
   * @returns {object} Final urls with updated links to include missing protocol
   */
  // TODO: Unify back-end and front-end linksettings/preset values to avoid conversion
  convertLinkSettingsToBackendFriendlyValues(linkSetting) {
    if (
      linkSetting.linkTracker.type === Constants.LINK_TRACKER.FREE.CUSTOM ||
      linkSetting.linkTracker.type === Constants.LINK_TRACKER.ENTITLED.CUSTOM
    ) {
      const isFreeCustom = _.first(linkSetting.linkTracker.trackingParameters).name === 'platform'
      if (isFreeCustom) {
        linkSetting.linkTracker.type = Constants.TRACKER_CUSTOM_TYPES.FREE
      } else {
        linkSetting.linkTracker.type = Constants.TRACKER_CUSTOM_TYPES.ENTITLED
      }
    }
    if (linkSetting.linkTracker.type === Constants.LINK_TRACKER.NONE) {
      linkSetting.linkTracker = null
    }

    if (linkSetting.linkShortenerId === Constants.LINK_SHORTENER.NONE) {
      linkSetting.linkShortenerId = null
    }

    if (linkSetting.linkTracker) {
      if (linkSetting.linkTracker.trackingParameters) {
        linkSetting.linkTracker.trackingParameters = _.map(
          linkSetting.linkTracker.trackingParameters,
          trackingParameter => {
            if (trackingParameter.type === Constants.LINK_TRACKING_PARAMS.TYPE.COMPOUND) {
              trackingParameter.compoundTracker.parameters = _.map(
                trackingParameter.compoundTracker.parameters,
                compoundParameter => {
                  if (
                    _.contains(Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC, compoundParameter.typeValue)
                  ) {
                    compoundParameter.typeValue =
                      ConstantMappings.TRACKING_PARAMS_TYPEVALUE_TO_BACKEND_TYPEVALUE[
                        compoundParameter.typeValue
                      ]
                  }
                  return compoundParameter
                },
              )
            } else {
              if (_.contains(Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC, trackingParameter.typeValue)) {
                trackingParameter.typeValue =
                  ConstantMappings.TRACKING_PARAMS_TYPEVALUE_TO_BACKEND_TYPEVALUE[trackingParameter.typeValue]
              }
            }
            return trackingParameter
          },
        )
      }
    }

    return linkSetting
  },

  /**
   * Takes in a link setting with back-end friendly values and converts the values to front-end display friendly values
   * @param {object} linkSetting with back-end friendly values
   * @returns {object} linkSetting with front-end display friendly values
   */
  // TODO: Unify back-end and front-end linksettings/preset values to avoid conversion
  convertLinkSettingsToFrontendFriendlyValues(linkSetting) {
    if (_.isEmpty(linkSetting.linkTracker)) {
      linkSetting.linkTracker = {
        type: Constants.LINK_TRACKER.NONE,
        trackingParameters: null,
      }
    }
    if (
      linkSetting.linkTracker.type === Constants.LINK_PRESETS_ACCEPTED_VALUES.LINK_TRACKER.FREE_CUSTOM ||
      linkSetting.linkTracker.type === Constants.LINK_PRESETS_ACCEPTED_VALUES.LINK_TRACKER.ENTITLED_CUSTOM
    ) {
      linkSetting.linkTracker.type = Constants.LINK_TRACKER.FREE.CUSTOM
    }
    if (!linkSetting.linkShortenerId) {
      linkSetting.linkShortenerId = Constants.LINK_SHORTENER.NONE
    }

    if (linkSetting.linkTracker) {
      if (linkSetting.linkTracker.trackingParameters) {
        linkSetting.linkTracker.trackingParameters = _.map(
          linkSetting.linkTracker.trackingParameters,
          trackingParameter => {
            if (trackingParameter.type === Constants.LINK_TRACKING_PARAMS.TYPE.COMPOUND) {
              trackingParameter.compoundTracker.parameters = _.map(
                trackingParameter.compoundTracker.parameters,
                compoundParameter => {
                  if (compoundParameter.type === Constants.LINK_TRACKING_PARAMS.TYPE.DYNAMIC) {
                    let key = _.invert(Constants.LINK_TRACKING_PARAMS.TYPEVALUE, compoundParameter.typeValue)[
                      compoundParameter.typeValue
                    ]
                    compoundParameter.typeValue = Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC[key]
                  }
                  return compoundParameter
                },
              )
            } else {
              if (trackingParameter.type === Constants.LINK_TRACKING_PARAMS.TYPE.DYNAMIC) {
                let key = _.invert(Constants.LINK_TRACKING_PARAMS.TYPEVALUE, trackingParameter.typeValue)[
                  trackingParameter.typeValue
                ]
                trackingParameter.typeValue = Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC[key]
              }
            }
            return trackingParameter
          },
        )
      }
    }
    return linkSetting
  },

  /**
   * Apply the preset to all links
   * @param {Object} preset
   * @param {Array} linkSettings
   * @returns {Array}
   */
  applyPreset(preset, linkSettings) {
    const linkSettingsWithPreset = cloneDeep(linkSettings).map(linkSetting => {
      // For backwards compatibility with old local storage presets
      if (preset.linkSettings && _.isObject(preset.linkSettings) && !Array.isArray(preset.linkSettings)) {
        linkSetting.linkTracker.type = preset.linkSettings.linkTracker.type
        linkSetting.linkTracker.trackingParameters = preset.linkSettings.linkTracker.trackingParameters
        linkSetting.linkShortenerId = preset.linkSettings.linkShortenerId
        linkSetting.previouslyComputedLink = null
      } else {
        linkSetting.linkTracker.type = preset.linkTracker.type
        linkSetting.linkTracker.trackingParameters = preset.linkTracker.trackingParameters
        linkSetting.linkShortenerId = preset.linkShortenerId
        linkSetting.previouslyComputedLink = null
      }
      return linkSetting
    })
    return linkSettingsWithPreset
  },

  /**
   * Apply default link settings to the given links
   * @param {Array} linkSettings
   * @returns {Array}
   */
  applyDefaultLinkSettings(linkSettings) {
    linkSettings = _.map(linkSettings, linkSetting => {
      linkSetting.linkTracker = {
        type: Constants.LINK_TRACKER.NONE,
        trackingParameters: null,
      }
      linkSetting.linkShortenerId = Constants.LINK_SHORTENER.NONE
      linkSetting.previouslyComputedLink = null
      return linkSetting
    })
    return linkSettings
  },

  /**
   * Return if link settings have a preset applied
   * @param {Object} preset
   * @param {Array} linkSettings
   * @returns {Boolean}
   */
  hasPresetApplied(preset, linkSettings) {
    return _.every(linkSettings, linkSetting => {
      return isEqual(
        omit(linkSetting, ['url', 'previouslyComputedLink', 'id']),
        omit(preset, 'name', 'state', 'organizationId', 'isDefault', 'id', 'linkShortener'),
      )
    })
  },

  /**
   * Computes the difference between 2 link settings arrays
   * @param {Array} linkSettingsA
   * @param {Array} linkSettingsB
   * @returns {Array}
   */
  linkDiff(linkSettingsA, linkSettingsB) {
    /* eslint-disable consistent-return */
    return _.compact(
      _.map(linkSettingsA, linkA => {
        if (
          !_.some(linkSettingsB, linkB => {
            if (_.isEqual(linkA, linkB)) {
              return linkA
            }
          })
        ) {
          return linkA
        }
      }),
    )
    /* eslint-enable consistent-return */
  },

  getLinkIndex(forLink, linkSettings) {
    return findIndex(linkSettings, link => {
      return link.url === forLink
    })
  },

  shortenAllLinksWithOwly(linkSettings) {
    const linkSettingsShortenedWithOwly = cloneDeep(linkSettings).map(linkSetting => {
      linkSetting.linkTracker.type = Constants.LINK_TRACKER.NONE
      linkSetting.linkTracker.trackingParameters = null
      linkSetting.linkShortenerId = Constants.LINK_SHORTENER_ID_OWLY
      linkSetting.previouslyComputedLink = null
      return linkSetting
    })
    return linkSettingsShortenedWithOwly
  },
}

export default LinkSettingsUtils
