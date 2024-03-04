import SocialNetworkPaywall from "./paywalls/social-network-paywall";
import ScheduledMessagesPaywall from "./paywalls/scheduled-messages-paywall";
import FreeProLoginPaywall from "./paywalls/free-pro-login-campaign";
import FreeAnalyticsPaywall from "./paywalls/free-analytics-paywall.js";
import RecommendedTimesToPostPaywall from "./paywalls/recommended_times_to_post";
import RecommendedTimesToPostPaywallPlanner from "./paywalls/recommended_times_to_post_planner";
import FreeOpenComposerIneligibleCanvaPaywall from "./paywalls/canva-open-composer-ineligible-trial-paywall";
import FreeOpenComposerEligibleCanvaPaywall from "./paywalls/canva-open-composer-eligible-trial-paywall";
import AllFreeEditCanvaPaywall from "./paywalls/canva-composer-allfree-edit-paywall";
import FreeCreateEvergreenCanvaPaywall from "./paywalls/canva-composer-create-evergreen-paywall";
import FreeCreateEligibleCanvaPaywall from "./paywalls/canva-composer-eligible-create-paywall";
import FreeCreateIneligibleCanvaPaywall from "./paywalls/canva-composer-ineligible-create-paywall";
import HashtagSuggestionsComposerPaywall from "./paywalls/hashtag-suggestions-composer";

const paywalls = [
    ScheduledMessagesPaywall,
    SocialNetworkPaywall,
    FreeProLoginPaywall,
    FreeAnalyticsPaywall,
    RecommendedTimesToPostPaywall,
    RecommendedTimesToPostPaywallPlanner,
    AllFreeEditCanvaPaywall,
    FreeOpenComposerIneligibleCanvaPaywall,
    FreeOpenComposerEligibleCanvaPaywall,
    FreeCreateEvergreenCanvaPaywall,
    FreeCreateEligibleCanvaPaywall,
    FreeCreateIneligibleCanvaPaywall,
    HashtagSuggestionsComposerPaywall,
];

export { paywalls };
