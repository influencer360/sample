import translation from "utils/translation";
import ProductLogoFilledFacebook from "@fp-icons/product-logo-filled-facebook";
import ProductLogoFilledLinkedIn from "@fp-icons/product-logo-filled-linkedin";
import ProductLogoFilledTwitter from "@fp-icons/product-logo-filled-twitter";

export default {
    icons: {
        FACEBOOK: ProductLogoFilledFacebook,
        LINKEDIN: ProductLogoFilledLinkedIn,
        TWITTER: ProductLogoFilledTwitter,
    },
    types: {
        FACEBOOK: "FACEBOOKADACCOUNT",
        LINKEDIN: "LINKEDINADACCOUNT",
        TWITTER: "TWITTERADACCOUNT",
    },
    socialNetworkAdAccountType: {
        FACEBOOKPAGE: "FACEBOOK",
        LINKEDINCOMPANY: "LINKEDIN",
        INSTAGRAMBUSINESS: "INSTAGRAM",
        TWITTER: "TWITTER",
    },

    permissionManageAdAccounts: "SN_MANAGE_AD_ACCOUNTS",

    permissionCreateAds: "can_create_ads",

    noPermissionTitle: {
        FACEBOOKPAGE: translation._("Reconnect Facebook Page"),
        LINKEDINCOMPANY: translation._("Reconnect Linkedin Page"),
        TWITTER: translation._("Reconnect Twitter Account"),
    },

    noPermissionMessage: {
        FACEBOOKPAGE: translation._(
            "Please reconnect this Facebook Page to Hootsuite and try again. This Page must be reconnected by a user with Advertiser or Ad Account Admin access."
        ),
        LINKEDINCOMPANY: translation._(
            "Please reconnect this LinkedIn Page to Hootsuite and try again. This Page must be reconnected by a user with Campaign or Account Manager access."
        ),
        TWITTER: translation._(
            "Please reconnect this Twitter Account to Hootsuite and try again. This Account must be reconnected by a user with Ad manager or Account Administrator access."
        ),
    },

    noAdAccountsMessage: {
        FACEBOOKPAGE: translation._(
            "You don't have any ad accounts associated with your Facebook page, create an ad account in Facebook."
        ),
        LINKEDINCOMPANY: translation._(
            "You don't have any ad accounts associated with your LinkedIn page, create an ad account in LinkedIn."
        ),
        TWITTER: translation._(
            "You don't have any ad accounts associated with your Twitter account. Create an ad account in Twitter."
        ),
    },

    noAdAccountsLearnMoreText: {
        FACEBOOKPAGE: translation._(
            "about how to create a Facebook ad account."
        ),
        LINKEDINCOMPANY: translation._(
            "about how to create a LinkedIn ad account."
        ),
        TWITTER: translation._(
            "Learn more about how to create a Twitter ad account."
        ),
    },

    noAdAccountsLearnMoreLink: {
        FACEBOOKPAGE:
            "https://www.facebook.com/business/help/205029060038706?helpref=page_content",
        LINKEDINCOMPANY:
            "https://business.linkedin.com/marketing-solutions/native-advertising",

        TWITTER:
            "https://business.twitter.com/en/help/account-setup/ads-account-creation.html",
    },
};
