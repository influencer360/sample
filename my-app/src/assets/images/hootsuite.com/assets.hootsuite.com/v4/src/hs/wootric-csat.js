let memberSignupDate = hs.memberSignupDate;
// must reformat provided date as YYYY/MM/dd HH:mm:ss vs YYYY-MM-dd HH:mm:ss
memberSignupDate = memberSignupDate.replace(/-/g, "/");

const languageMap = {
    "en": "EN",
    "es": "ES",
    "fr": "FR",
    "de": "DE"
};

window.wootricSettings = {
    email: hs.memberEmail,
    created_at: Math.round(new Date(memberSignupDate).getTime() / 1000),
    account_token: 'NPS-f0cfd5d7',
    properties: {
        country: hs?.countryCode ? hs.countryCode : null,
        region: hs?.timezoneName ? hs.timezoneName : null,
        max_plan_code: hs?.memberMaxPlanCode ? hs.memberMaxPlanCode : null,
        member_id: hs?.memberId ? hs.memberId : null,
        organization_id_amount: hs?.firstOrganization?.orgId ? parseInt(hs?.firstOrganization?.orgId) : null,
        language: (hs?.language && languageMap[hs?.language]) ? languageMap[hs.language] : null,
        platform: 'web'
    },
};

let beacon = document.createElement('script');
beacon.type = 'text/javascript';
beacon.id = 'wootric-beacon';
beacon.src = 'https://disutgh7q0ncc.cloudfront.net/beacon.js';
beacon.async = true;
beacon.onload=function() {
    window.WootricSurvey.run(window.wootricSettings);
};
if (document.getElementById('wootric-beacon') == null) {
    document.body.appendChild(beacon)
}


