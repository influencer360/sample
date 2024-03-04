var organizationSection = 'organization';
var memberManagement = 'member_management';
var memberProfile = 'member_profile';
var organizationList = 'organization_list';
var socialNetworkList = 'social_network_list';
var adAccountList = 'ad_account_list';
var addAdAccount = 'add_ad_account';
var addAdAccountNone = 'add_ad_account_none';
var addAdAccountNoPermissions = 'add_ad_account_no_permissions';
var openMenuButton = 'remove_ad_account_show_options';
var removeAdAccount = 'remove_ad_account';

var organizationListPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + organizationList;
var socialNetworkListPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + socialNetworkList;
var adAccountListPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + adAccountList;
var addAdAccountNonePath = 'web.' + organizationSection + '.'  + memberManagement + '.' + addAdAccountNone;
var addAdAccountNoPermissionsPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + addAdAccountNoPermissions;
var addAdAccounPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + addAdAccount;
var openMenuButtonPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + openMenuButton;
var removeAdAccountPath = 'web.' + organizationSection + '.'  + memberManagement + '.' + removeAdAccount;


export default {
    organizationSection: organizationSection,
    memberManagement: memberManagement,
    memberProfile: memberProfile,
    organizationList: organizationList,
    socialNetworkList: socialNetworkList,
    organizationListPath: organizationListPath,
    socialNetworkListPath: socialNetworkListPath,
    openMenuButton: openMenuButtonPath,
    adAccountList: adAccountListPath,
    removeAdAccount: removeAdAccountPath,
    addAdAccount: addAdAccounPath,
    addAdAccountNone: addAdAccountNonePath,
    addAdAccountNoPermissions: addAdAccountNoPermissionsPath,
};
