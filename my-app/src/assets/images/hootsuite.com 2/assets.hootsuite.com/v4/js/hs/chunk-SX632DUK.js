import{b as h,c as w}from"./chunk-RBJWJTV5.js";w();window.popauth=function(e,n,p,u,i,l){var o=this,s="popauth_"+e||"popauth_instance";this.r_popup=null,this.start=function(r){r=r||{};var a=function(t,d,_,g){$(document).unbind(s),r.keepPopupAfterSuccess||o.r_popup&&!o.r_popup.closed&&o.r_popup.close(),g&&$.isFunction(l)?l():$.isFunction(p)&&p(t,d,_)};if($(document).unbind(s).bind(s,a),r.direct){o.r_popup=window.open(n,"","toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=450");return}o.r_popup=window.open(hs.util.getUrlRoot()+"/network/network-popup-preloader","","toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=450");var c=function(t){setTimeout(function(){o.r_popup.document.location=t},100),o.r_popup.focus()},f=function(){n.match(/^https?:\/\//)?c(n):ajaxCall({url:n,success:function(t){t.url?c(t.url):(o.r_popup.close(),hs.statusObj.update(h._("An error occurred while connecting to external API. Please try again later")+" Code: "+t.errorCode,"error",!0,6e3),$.isFunction(u)&&u())}},"qm")};i&&$.isFunction(i)?i(f):f()},this.resize=function(r,a){o.r_popup.window.resizeTo(r+20,a+100)}};hs.popauth=hs.popauth||{};hs.popauth.triggerCallback=function(e,n,p,u){if(typeof e!="string"||!e.length){u&&$(document).triggerHandler("popauth_facebookgraph",[null,null,1]);return}var i=[n,p];$(document).triggerHandler("popauth_"+e,i)};var b=window.popauth;export{b as a};
//# sourceMappingURL=chunk-SX632DUK.js.map
