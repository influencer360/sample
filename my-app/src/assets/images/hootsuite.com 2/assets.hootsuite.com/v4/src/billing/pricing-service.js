import _ from 'underscore';
import 'utils/ajax';

/**
 * Representation of a member's pricing state
 * @typedef {Object} PricingProfile
 * @property {string} currency - One of the PRICING_XXX constants from PlanFeature
 * @property {string} billingInterval - One of the PlanFeature::BILLING_INTERVAL_XXX constants
 */

/**
 * Representation of a Feature record
 * @typedef {Object} Feature
 * @property {number} featureId
 * @property {string} code - Feature code
 * @property {string} type - 'MAX' or 'BOOL'
 * @property {string} ariaCode
 * @property {string} ariaCodeAnnual
 * @property {number} cost
 * @property {number} costAnnual
 * @property {number} addonRequiredPlanId
 * @property {bool}   isInheritable
 */

/**
 * Representation of a Feature Discount (contained in Coupons)
 * @typedef {Object} FeatureDiscount
 * @property {number} amount
 * @property {number} couponId
 * @property {string} discountDescription
 * @property {number} featureId
 * @property {string} priceType (flat, percentage, none)
 */

/**
 * Representation of a Coupon
 * @typedef {Object} Coupon
 * @property {string} billingPeriod
 * @property {number} couponId
 * @property {string} description
 * @property {number} expiryMonths
 * @property {FeatureDiscount[]} featureDiscounts
 * @property {boolean} isPackage
 * @property {number} lowerThreshold
 * @property {number} upperThreshold
 * @property {number} usesRemaining
 * @property {string} validUntil - Date in the MySQL format (YYYY-MM-DD)
 */

/**
 * Utility service for working with plan and feature pricing
 * @class
 * @property {object} pricingData
 * @property {PricingProfile} pricingProfile
 * @property {object} features - Mapping of feature code to id and name
 */
var PricingService = function () {
    // Populate the default pricing profile
    this.pricingProfile = {
        currency: PricingService.defaultCurrency,
        billingInterval: PricingService.defaultBillingInterval
    };
};

/**
 * Monthly billing interval (constant)
 * @static
 * @type {string}
 */
PricingService.INTERVAL_MONTHLY = 'MONTHLY';

/**
 * Yearly billing interval (constant)
 * @static
 * @type {string}
 */
PricingService.INTERVAL_YEARLY = 'YEARLY';

/**
 * Default currency (One of the PRICING_XXX constants from PlanFeature)
 * @static
 * @type {string}
 */
PricingService.defaultCurrency = 'PRICING_USD';

/**
 * Default billing interval (One of the BILLING_INTERVAL_XXX constants from PlanFeature)
 * @static
 * @type {string}
 */
PricingService.defaultBillingInterval = PricingService.INTERVAL_MONTHLY;

/**
 * Features with tiered pricing
 * @type {string[]}
 */
PricingService.TIERED_FEATURES = ['SEATS', 'PRIORITY_SUPPORT', 'MESSAGE_ARCHIVING', 'PUBLISHER_PRO'];

_.extend(PricingService.prototype, /** @lends PricingService.prototype */{

    /**
     * Build a pricing profile by falling back to the default values where needed
     * @param {PricingProfile} [pricingProfile]
     */
    resolvePricingProfile: function (pricingProfile) {
        if (!pricingProfile) {
            return this.pricingProfile;
        }
        return _.extend({}, this.pricingProfile, pricingProfile);
    },

    /**
     * Make an ajax request to populate pricing data for all currencies
     * @param {boolean} [force] - Whether to force a reload of the data (defaults to false)
     * @return {object} - jQuery deferred object representing the ajax request
     */
    fetchPricingData: function (force) {
        if (force || !this.isDataLoadStarted()) {
            this.pricingDataPromise = ajaxCall({
                url: '/ajax/billing/get-pricing-data'
            }, 'qm').then(_.bind(this.loadedPricingData, this));
        }
        return this.pricingDataPromise;
    },

    /**
     * Determine if the pricing data has been loaded or is being loaded
     * Returns false if ajax request completed but failed.
     * @return {boolean}
     */
    isDataLoadStarted: function () {
        if (!this.pricingDataPromise) {
            return false;
        }
        var state = this.pricingDataPromise.state();
        return (state === 'pending' || state === 'resolved');
    },

    /**
     * Determine if the pricing data has been loaded and is ready for use
     * @return {boolean}
     */
    isDataLoaded: function () {
        return !!this.pricingData;
    },

    /**
     * Handler for ajax call
     * @param {object} response
     */
    loadedPricingData: function (response) {
        this.pricingData = response;
        // Populate features mapping
        var features = this.pricingData.featurePricing[PricingService.defaultCurrency];

        this.features = _.object(_.map(features, function (feature, featureId) {
            return [feature.code, {
                id: featureId,
                name: feature.name
            }];
        }));
    },

    /**
     * Calculate feature pricing given a hash of {featureCode: amount/value}
     * @param {Object.<string, number|boolean>} selectedFeatures
     * @param {PricingProfile} [pricingProfile] - Pricing profile to override pricingProfile set on PricingService
     * @return {Object.<string, number>} Hash of featureCodes and prices
     */
    calculateFeaturePricing: function (selectedFeatures, pricingProfile) {
        pricingProfile = this.resolvePricingProfile(pricingProfile);

        return _.object(_.map(selectedFeatures, function (featureValue, featureCode) {
            return [featureCode, this.getFeatureCost(featureCode, featureValue, pricingProfile)];
        }, this));
    },

    /**
     * Calculate feature pricing given a hash of {featureCode: amount/value}
     * @param {string} featureCode
     * @param {PricingProfile} [pricingProfile] - Pricing profile to override pricingProfile set on PricingService
     * @return {?Feature}
     */
    getFeatureData: function (featureCode, pricingProfile) {
        pricingProfile = this.resolvePricingProfile(pricingProfile);
        var features = this.pricingData.featurePricing[pricingProfile.currency];
        return _.findWhere(features, {code: featureCode});
    },

    /**
     * Calculate the cost of a feature
     * @param {string} featureCode
     * @param {number} amount
     * @param {PricingProfile} [pricingProfile] - Pricing profile to override pricingProfile set on PricingService
     * @returns {number}
     */
    getFeatureCost: function (featureCode, amount, pricingProfile) {
        // Zero amounts are always free
        if (!amount) {
            return 0;
        }

        pricingProfile = this.resolvePricingProfile(pricingProfile);
        var featureData = this.getFeatureData(featureCode, pricingProfile);
        var costKey = (pricingProfile.billingInterval === PricingService.INTERVAL_YEARLY) ? 'costAnnual' : 'cost';
        var unitCost = parseFloat(featureData[costKey]);
        var planIncluded = this.getPlanBaseValues(featureCode).value;

        if (amount <= planIncluded) {
            return 0;
        }

        if (planIncluded) {
            amount = amount - planIncluded;
        }

        if (this.isTieredFeature(featureCode)) {
            return this.getCostForTieredFeature(featureCode, amount, pricingProfile);
        }

        return unitCost * amount;
    },

    /**
     * Get the total cost for a tiered feature
     * @param {string} featureCode
     * @param {number} amount
     * @param {PricingProfile} [pricingProfile]
     * @returns {number}
     */
    getCostForTieredFeature: function (featureCode, amount, pricingProfile) {
        var cost = 0;
        var tier;

        pricingProfile = this.resolvePricingProfile(pricingProfile);

        for (var i = 1; i <= amount; i++) {
            tier = this.getFeatureTier(featureCode, i, pricingProfile);
            if (tier) {
                cost += tier['price'];
            }
        }

        return cost;
    },

    /**
     * Get feature id for feature code
     * @param {string} featureCode
     * @returns {number}
     */
    getFeatureId: function (featureCode) {
        if (!this.features[featureCode]) {
            return null;
        }
        return parseInt(this.features[featureCode].id, 10);
    },

    /**
     * Get feature code for feature id
     * @param {int} featureId
     * @returns {null|string}
     */
    getFeatureCode: function (featureId) {
        var code = null;
        _.each(this.features, function (feature, featureCode) {
            if (feature.id == featureId) {
                code = featureCode;
            }
        });
        return code;
    },

    /**
     * Get the plan included values for the feature
     * @param {string} featureCode
     * @returns {object}
     */
    getPlanBaseValues: function (featureCode) {
        return this.pricingData.planBaseFeatures[this.getFeatureId(featureCode)];
    },

    /**
     * Determine if a feature has multiple tiers
     * @param featureCode
     * @returns {*}
     */
    isTieredFeature: function (featureCode) {
        return (_.indexOf(PricingService.TIERED_FEATURES, featureCode) !== -1);
    },

    /**
     * Get the appropriate pricing tier for a feature amount
     * @param {string} featureCode
     * @param {number} count
     * @param {PricingProfile} [pricingProfile]
     * @return {null|object}
     */
    getFeatureTier: function (featureCode, count, pricingProfile) {
        if (!this.isTieredFeature(featureCode)) {
            return null;
        }

        pricingProfile = this.resolvePricingProfile(pricingProfile);

        var tiers = this.pricingData.featureTiers[pricingProfile.billingInterval][pricingProfile.currency][featureCode];
        var matchingTier = null;
        _.each(tiers, function (tier) {
            if (count <= tier.max) {
                if (!matchingTier) {
                    matchingTier = tier;
                }
            }
        });
        return matchingTier;
    },

    /**
     * Get the cost of the pro plan for the given pricing profile
     * @param {PricingProfile} pricingProfile
     * @returns {Number}
     */
    getPlanCost: function (pricingProfile) {
        pricingProfile = this.resolvePricingProfile(pricingProfile);
        return parseFloat(this.pricingData.planPricing[pricingProfile.billingInterval][pricingProfile.currency]);
    },

    /**
     * Calculate the effect a given coupon has on feature pricing
     * @param {object} featurePricing
     * @param {Coupon} coupon
     * @returns {object.<string, object>} Hash of featureCodes to object with properties discountType, discountAmount, and subtotal
     */
    getCouponDiscountsForFeaturePricing: function (featurePricing, coupon) {
        var self = this;
        var featureCode;
        var discounts = {};

        var applyDiscount = function (discount, price, featureCode) {
            if (!price) {
                return;
            }

            if (discounts[featureCode]) {
                if (discounts[featureCode].discountType !== discount.priceType) {
                    discounts[featureCode].discountType = 'mixed';
                    // Amount makes no sense when multiple types were applied
                    discounts[featureCode].discountAmount = null;
                } else {
                    discounts[featureCode].discountAmount += discount.amount;
                }
                discounts[featureCode].subtotal += self.getCouponDiscountForPrice(price, discount);

            } else {
                discounts[featureCode] = {
                    discountType: discount.priceType,
                    discountAmount: discount.amount,
                    subtotal: self.getCouponDiscountForPrice(price, discount)
                };
            }
        };

        _.each(coupon.featureDiscounts, function (discount) {
            // Global discount
            if (!discount.featureId) {
                _.each(featurePricing, _.bind(applyDiscount, null, discount));
                return;
            }

            // Feature-specific discount
            featureCode = self.getFeatureCode(discount.featureId);

            // handle Hootsuite Pro coupons
            if (discount.featureId == 255) {
                featureCode = 'HOOTSUITE_PRO';
            }

            if (!_.has(featurePricing, featureCode)) {
                return;
            }
            applyDiscount(discount, featurePricing[featureCode], featureCode);
        });

        return discounts;
    },

    /**
     * Calculate the new price after applying the given coupon discount
     * @param {number} price
     * @param {FeatureDiscount} discount
     * @returns {number}
     */
    getCouponDiscountForPrice: function (price, discount) {
        if (discount.priceType === 'flat') {
            return Math.min(discount.amount, price);
        }
        return (price * discount.amount / 100);
    },

    /**
     * Calculate the total discount amount for the given plan subtotal (ex. 9.99), feature pricing, and a coupon
     * @param {number} planSubtotal
     * @param {object.<string, number>} featurePricing
     * @param {Coupon} coupon
     * @returns {number}
     */
    calculateTotalCouponDiscount: function (planSubtotal, featurePricing, coupon) {
        var featureSubtotal = _.reduce(featurePricing, function (sum, price) {
            return sum + price;
        }, 0);
        var featureDiscounts = this.getCouponDiscountsForFeaturePricing(featurePricing, coupon);
        var featureDiscountTotal = _.reduce(featureDiscounts, function (sum, discount) {
            return sum + discount.subtotal;
        }, 0);
        var globalDiscounts = _.where(coupon.featureDiscounts, {featureId: 0});
        var globalTotal = _.reduce(globalDiscounts, function (sum, discount) {
            return sum + this.getCouponDiscountForPrice(planSubtotal, discount);
        }, 0, this);

        // Floating point fun!
        featureDiscountTotal = parseFloat(featureDiscountTotal.toFixed(2));
        globalTotal = parseFloat(globalTotal.toFixed(2));

        var couponTotal = featureDiscountTotal + globalTotal;

        if (couponTotal > (planSubtotal + featureSubtotal)) {
            couponTotal = (planSubtotal + featureSubtotal);
        }

        return couponTotal;
    }
});

export default PricingService;

