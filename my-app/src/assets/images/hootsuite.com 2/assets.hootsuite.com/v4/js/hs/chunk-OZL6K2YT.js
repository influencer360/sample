import{b as i,c as C}from"./chunk-RBJWJTV5.js";var h={getNetworkTypesExcept:function(n){return Object.keys(hs.networksConf).filter(function(o){return!n.includes(o)})},getExcludedNetworkTypesForComponent:function(n,o){var e=[];if(typeof hs.networksConf<"u"&&typeof n=="string"){var s=function(r){var t=hs.networksConf[r]&&hs.networksConf[r].components&&hs.networksConf[r].components[n],f=typeof t>"u"||t===null;return o&&!f&&(f=t.context!==o),f};e=Object.keys(hs.networksConf).filter(s)}return e},getNetworkTypesWithNoCommonComponents:function(){var n=[];if(typeof hs.networksConf<"u"){var o=function(s){return s.context&&s.context==="COMMON"},e=function(s){return function(r){var t=hs.networksConf[r]&&hs.networksConf[r].components,f=typeof t>"u"||t===null;return t&&(f=Object.values(t).filter(s).length===0),f}};n=Object.keys(hs.networksConf).filter(e(o))}return n},getNetworkName:function(n){return hs.networksConf[n]&&hs.networksConf[n].name},getParentType:function(n){return hs.networksConf[n]&&hs.networksConf[n].parentType},getAuthSuccessFollowup:function(n){return hs.networksConf[n]&&hs.networksConf[n].authSuccessFollowup},getComponentContext:function(n,o){return hs.networksConf[n]&&hs.networksConf[n].components&&hs.networksConf[n].components[o]&&hs.networksConf[n].components[o].context},getIconSourceKey:function(n){return hs.networksConf[n]&&hs.networksConf[n].iconSourceKey},getBrandColour:function(n){return hs.networksConf[n]&&hs.networksConf[n].brandColour}},c=h;C();var u={NETWORK_TYPES:[],NETWORK_NAMES:{},MULTI_PROFILE_NETWORKS:[]};Object.keys(hs.networksConf).forEach(function(n){u[n]=n,u.NETWORK_TYPES.push(n);var o=c.getParentType(n);o&&u.MULTI_PROFILE_NETWORKS.indexOf(o)<0&&u.MULTI_PROFILE_NETWORKS.push(o);var e=c.getNetworkName(n);u.NETWORK_NAMES[n]=i._(e)});var N={c:u};export{c as a,N as b};
//# sourceMappingURL=chunk-OZL6K2YT.js.map
