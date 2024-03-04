import{h as w,i as F}from"./chunk-H7SY6GNV.js";import{a as D}from"./chunk-JRESDEDW.js";import{b as d,c as A}from"./chunk-RBJWJTV5.js";import{a as _}from"./chunk-5M6X2SDJ.js";import{b as I,f as S}from"./chunk-62VJZGPO.js";var y,x=I(()=>{y=function(){var e=/d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,t=/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,r=/[^-+\dA-Z]/g,i=function(o,s){for(o=String(o),s=s||2;o.length<s;)o="0"+o;return o};return function(o,s,l){var u=y;if(arguments.length==1&&Object.prototype.toString.call(o)=="[object String]"&&!/\d/.test(o)&&(s=o,o=void 0),o=o&&!isNaN(o)?new Date(o):new Date,isNaN(o))throw SyntaxError("invalid date");s=String(u.masks[s]||s||u.masks.default),s.slice(0,4)=="UTC:"&&(s=s.slice(4),l=!0);var f=l?"getUTC":"get",p=o[f+"Date"](),T=o[f+"Day"](),m=o[f+"Month"](),M=o[f+"FullYear"](),h=o[f+"Hours"](),C=o[f+"Minutes"](),E=o[f+"Seconds"](),g=o[f+"Milliseconds"](),b=l?0:o.getTimezoneOffset(),P={d:p,dd:i(p),ddd:u.i18n.dayNames[T],dddd:u.i18n.dayNames[T+7],m:m+1,mm:i(m+1),mmm:u.i18n.monthNames[m],mmmm:u.i18n.monthNames[m+12],yy:String(M).slice(2),yyyy:M,h:h%12||12,hh:i(h%12||12),H:h,HH:i(h),M:C,MM:i(C),s:E,ss:i(E),l:i(g,3),L:i(g>99?Math.round(g/10):g),t:h<12?"a":"p",tt:h<12?"am":"pm",T:h<12?"A":"P",TT:h<12?"AM":"PM",Z:l?"UTC":(String(o).match(t)||[""]).pop().replace(r,""),o:(b>0?"-":"+")+i(Math.floor(Math.abs(b)/60)*100+Math.abs(b)%60,4),S:["th","st","nd","rd"][p%10>3?0:(p%100-p%10!=10)*p%10]};return s.replace(e,function(v){return v in P?P[v]:v.slice(1,v.length-1)})}}();y.masks={default:"ddd mmm dd yyyy HH:MM:ss",shortDate:"m/d/yy",mediumDate:"mmm d, yyyy",longDate:"mmmm d, yyyy",fullDate:"dddd, mmmm d, yyyy",shortTime:"h:MM TT",mediumTime:"h:MM:ss TT",longTime:"h:MM:ss TT Z",isoDate:"yyyy-mm-dd",isoTime:"HH:MM:ss",isoDateTime:"yyyy-mm-dd'T'HH:MM:ss",isoUtcDateTime:"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"};y.i18n={dayNames:["Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],monthNames:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","January","February","March","April","May","June","July","August","September","October","November","December"]};Date.prototype.format=function(e,t){return y(this,e,t)}});var a,c,n,j,O=I(()=>{a=S(D()),c=S(_());A();F();x();n={};n.isIE=!!a.default.browser.msie||navigator.appName=="Microsoft Internet Explorer"||navigator.appName=="Netscape"&&new RegExp("Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})").exec(navigator.userAgent)!=null;n.isIE7=n.isIE&&parseInt(a.default.browser.version,10)<=7;n.isIE8=n.isIE&&parseInt(a.default.browser.version,10)===8;n.isIE9=n.isIE&&parseInt(a.default.browser.version,10)===9;n.isIE9orBelow=n.isIE&&parseInt(a.default.browser.version,10)<=9;n.isIE10orBelow=n.isIE&&parseInt(a.default.browser.version,10)<=10;n.isIE11orBelow=n.isIE&&parseInt(a.default.browser.version,10)<=11;n.isEdge=navigator.appName=="Netscape"&&new RegExp("Edge/").exec(navigator.userAgent)!=null;n.isSafari=!!a.default.browser.safari;n.isChrome=typeof window.chrome<"u"&&typeof window.chrome.app<"u"&&typeof window.chrome.app.isInstalled<"u";n.isFireFox=!!a.default.browser.mozilla&&!navigator.userAgent.match(/Trident/);n.isEmailValid=function(e){return/^[^@]+?@.{1,}?\..{2,}$/.test(e)};n.isPasswordValid=function(e){return e.length>=4};n.isResetPasswordValid=function(e){return e.length>=8};n.isGoogleAuthenticatorValid=function(e){return/^\d{6}$/.test(e)};(function(e){var t=e([1]);e.fn.each2=function(r){for(var i=-1;(t.context=t[0]=this[++i])&&r.call(t[0],i,t)!==!1;)e.noop();return this}})(jQuery);a.default.fn.swapClass=function(e,t){return this.each(function(){(0,a.default)(this).toggleClass(e).toggleClass(t)})};a.default.fn.formValues=function(e){var t=(0,a.default)(this).find(":input").get();return typeof e!="object"?(e={},a.default.each(t,function(){var r=/select|textarea/i,i=/text|hidden|password/i;this.name&&!this.disabled&&(this.checked||r.test(this.nodeName)||i.test(this.type))&&(e[this.name]=(0,a.default)(this).val())}),e):(a.default.each(t,function(){this.name&&e[this.name]&&(this.type=="checkbox"||this.type=="radio"?(0,a.default)(this).attr("checked",e[this.name]==(0,a.default)(this).val()):(0,a.default)(this).val(e[this.name]),(0,a.default)(this).change())}),(0,a.default)(this))};n.ucFirst=function(e){return e.charAt(0).toUpperCase()+e.slice(1)};n.toClassCase=function(e){return e=e||"",e.toLowerCase().replace(/(?:^|_)([a-z])/g,function(t,r){return r.toUpperCase()})};window.fadeSlideRemove=function(e,t,r){t||(t=0),(0,a.default)(e).animate({opacity:1},t).animate({opacity:0},400).slideUp(200,function(){(0,a.default)(e).remove(),a.default.isFunction(r)&&r()})};window.disableEnterKey=function(e){var t=window.event?window.event.keyCode:e.which;return t!=13};window.checkForEnterKey=function(e,t){var r=window.event?window.event.keyCode:e.which;r===13&&(e&&e.preventDefault&&e.preventDefault(),t!==void 0?(0,a.default)("."+t).click():hs.submitClass!==void 0&&(0,a.default)("."+hs.submitClass).click())};window.getFlashMovieObject=function(e){if(window.document[e])return window.document[e];if(navigator.appName.indexOf("Microsoft Internet")===-1){if(document.embeds&&document.embeds[e])return document.embeds[e]}else return document.getElementById(e)};window.truncate=function(e,t,r){if(r=r||"...",t=t-r.length,!t||!e||t>=e.length)return e;var i=e.substr(0,t),o=i.lastIndexOf(" ");return o>-1&&(i=i.substring(0,o)),i+r};window.resizeToInner=function(e,t){var r=window.resizeToInner,i=r.cwidth,o=r.cheight;if(i&&o){window.resizeTo(e+i,t+o);return}window.outerWidth?(i=r.cwidth=window.outerWidth-(0,a.default)(window).width(),o=r.cheight=window.outerHeight-(0,a.default)(window).height(),window.resizeTo(e+i,t+o)):(window.moveTo(0,0),window.resizeTo(screen.availWidth,screen.availHeight),setTimeout(function(){var s=[(0,a.default)(document).width(),(0,a.default)(document).height()];i=r.cwidth=screen.availWidth-s[0],o=r.cheight=screen.availHeight-s[1],window.resizeTo(e+i,t+o)},1))};hs.onAvatarError=function(e){return e.className=e.className+" icon-30 noAvatar",!0};hs.replaceAvatarWithDefault=function(e){return e.src=hs.util.getDefaultAvatar("member"),!0};hs.reloadBrowser=function(){setTimeout(function(){try{window.location.reload()}catch{window.location.href=hs.c.rootUrl}},1)};jQuery.expr[":"].Contains=function(e,t,r){return jQuery(e).text().toUpperCase().indexOf(r[3].toUpperCase())>=0};jQuery.expr[":"].startsWith=function(e,t,r){return a.default.trim(jQuery(e).text().toUpperCase()).indexOf(r[3].toUpperCase())===0};n.tzDate=function(){var e=function(o){return o*60*1e3},t=Array.prototype.slice.call(arguments,0,arguments.length-1),r=arguments[arguments.length-1];(arguments.length===0||arguments.length==1)&&(t=[],r=arguments.length?arguments[0]:0);let i=new Date(...t);return new Date(+i+e(i.getTimezoneOffset())-e(r))};n.userDate=function(){var e=function(r){return r/60*-1},t=Array.prototype.slice.call(arguments);return t.push(e(hs.timezoneOffset)),n.tzDate.apply(null,t)};n.myDate=function(){return new Date(new Date().getTime()+hs.timezoneOffset*1e3)};n.dateFromUtcTimestamp=function(e){var t=new Date(e);return new Date(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate(),t.getHours(),t.getMinutes(),t.getSeconds(),t.getMilliseconds()))};n.userDateFromUtc=function(e){return n.userDate(+n.dateFromUtcTimestamp(e))};n.userDateHootsuiteTime=function(e){var t=new Date(e*1e3).format("UTC:yyyy:mm:dd HH:MM:ss").match(/(\d+):(\d+):(\d+) (\d+):(\d+):(\d+)/);return t?new Date(t[1],t[2]*1-1,t[3],t[4],t[5],t[6]):null};n.isStringNumLte=function(e,t){return typeof e=="string"&&typeof t=="string"&&e.length>t.length?!1:e<=t};n.numberFormat=function(e,t){t&&(e=parseFloat(e).toFixed(t)),e+="";for(var r=e.split("."),i=r[0],o=r.length>1?"."+r[1]:"",s=/(\d+)(\d{3})/;s.test(i);)i=i.replace(s,"$1,$2");return i+o};n.inherit=function(e,t){var r=function(){};r.prototype=t.prototype,e.prototype=new r,e.prototype.superclass=t.prototype,e.prototype.constructor=e};n.extend=function(e,t){var r=this,i;e&&c.default.has(e,"constructor")?i=e.constructor:i=function(){return r.apply(this,arguments)},c.default.extend(i,r,t);var o=function(){this.constructor=i};return o.prototype=r.prototype,i.prototype=new o,e&&c.default.extend(i.prototype,e),i.__super__=r.prototype,i};n.parseQueryString=function(e){var t={},r,i=/\+/g,o=/([^&=]+)=?([^&]*)/g,s=function(u){return decodeURIComponent(u.replace(i," "))},l=0<e.length&&e.indexOf("?")===0?e.substring(1):e;for(r=o.exec(l);r;)t[s(r[1])]=s(r[2]),r=o.exec(l);return t};n.toggleLoginBoxView=function(e){var t=(0,a.default)("form[name='memberLoginForm']"),r=!1;return t.length===0&&(t=(0,a.default)("form[name='memberLoginPopupForm']"),r=!0),e=="sso"?(t.find("._loginPasswordBlock").hide(),t.find("._loginSsoBlock").show(),t.find("#useOneLogin").val("on"),r&&((0,a.default)("#memberPopLoginContainer .btns ._loginPasswordBlock").hide(),(0,a.default)("#memberPopLoginContainer .btns ._loginSsoBlock").show())):(t.find("._loginSsoBlock").hide(),t.find("._loginPasswordBlock").show(),t.find("#useOneLogin").val(""),r&&((0,a.default)("#memberPopLoginContainer .btns ._loginSsoBlock").hide(),(0,a.default)("#memberPopLoginContainer .btns ._loginPasswordBlock").show())),t.find("input._loginEmailInput").focus(),!1};(function(){var e;a.default.fn.hsPlaceholder=function(){e==null&&(e="placeholder"in document.createElement("input"));var t=(0,a.default)(this).find("input, textarea");if(t.length!==0)return t.each(function(){var r=(0,a.default)(this),i=r.attr("placeholder");i?r.data("placeholder",i):i=r.data("placeholder"),i&&(e?r.attr("placeholder",i):(r.val()===""&&r.val(i).addClass("phInactive"),r.focus(function(){a.default.trim(r.val())==r.data("placeholder")&&r.val("").removeClass("phInactive")}).blur(function(){a.default.trim(r.val())===""&&r.val(r.data("placeholder")).addClass("phInactive")})))}),this}})();n.getMouseXY=function(e){var t,r;return typeof event<"u"&&event.clientX?(t=event.clientX+document.body.scrollLeft,r=event.clientY+document.body.scrollTop):(t=e.pageX,r=e.pageY),t<0&&(t=0),r<0&&(r=0),{left:t,top:r}};n.recordAction=function(e,t){var r={event:e};t&&(r=c.default.extend(r,c.default.pick(t,"value","snType","snPicker","statType","splitByLocation","useEventAsName")));var i=hs.util.getUrlRoot();return fetch(i+"/ajax/index/statsd?csrfToken="+hs.csrfToken,{method:"POST",mode:"cors",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)})};n.isCanvasSupported=function(){var e=document.createElement("canvas");return!!(e.getContext&&e.getContext("2d"))};n.convertToUTCTimestamp=function(e,t,r,i){i=="AM"&&t==12?t=0:t=(i=="AM"?0:1)*12+t,e=e.split("-");var o=e[0],s=parseInt(e[1],10)-1,l=parseInt(e[2],10);return new Date(o,s,l,t,r)};n.userIsEnterprisey=function(){return hs.memberMaxPlanCode==="ENTERPRISE"||hs.memberMaxPlanCode==="EMPLOYEE"};n.getURLParams=function(){var e={};return location.search&&location.search.length>1&&c.default.each(location.search.substr(1).split("&"),function(t){if(t!==""){var r=t.split("=");e[r[0]]=r[1]&&decodeURIComponent(r[1].replace(/\+/g," "))}}),e};n.getURLParamsFromHash=function(){var e={};if(location.hash&&location.hash.length>1){var t=location.hash.split("?");if(t.length>1){var r=t[1];c.default.each(r.split("&"),function(i){if(i!==""){var o=i.split("=");e[o[0]]=o[1]&&decodeURIComponent(o[1].replace(/\+/g," "))}})}}return e};n.serializeObject=function(e){var t={};return c.default.each(e.serializeArray(),function(r){n.desquare(r.name,r.value,t)}),t};n.desquare=function(e,t,r){if(!!c.default.isString(e)){e=e.split(/]?\[|]/),c.default.last(e)===""&&e.pop();for(var i=e.length-1,o=r,s=c.default.last(e)==="",l=0;l<=i;l++){var u=e[l];if(l==i)o[u]=t;else if(s&&l==i-1){c.default.isArray(o[u])||(o[u]=[]),o[u].push(t);break}else Object.prototype.hasOwnProperty.call(o,u)||(o[u]={}),o=o[u]}}};n.castOptionsToInt=function(e){return e?(c.default.each(c.default.rest(arguments),function(t){e[t]&&(e[t]=parseInt(e[t],10))}),e):{}};n.newPasswordPolicyChecker=function(e,t){var r={length:e.length>=8,upper:e.match(/[A-Z]/)!==null,lower:e.match(/[a-z]/)!==null,match:e===t};return r};n.policyChecker=function(e){return{length:e.length>=8,upper:e.match(/[A-Z]/)!==null,lower:e.match(/[a-z]/)!==null}};n.newPolicyChecker=function(e,t){return{...n.policyChecker(e),match:e===t}};n.invalidPolicies=function(e){return!!c.default.filter(e,function(t){return!t}).length};n.mapPolicyMessages=function(e,t){return c.default.map(e,function(r,i){return{name:i,pass:r,message:t[i]}})};n.checkNewPasswordPolicy=function(e,t){var r=e.val(),i=t.val(),o=!1;t&&(i=t.val());var s={};s={length:d._(" 8 characters long"),upper:d._(" Uppercase letter"),lower:d._(" Lowercase letter"),match:d._(" Passwords must match ")};var l=n.newPolicyChecker(r,i);n.clearBubbles();var u=w.getEjs("infoBubble").render({policies:n.mapPolicyMessages(l,s)});return n.invalidPolicies(l)?(e.addClass("error"),t.addClass("error")):(e.removeClass("error"),t.removeClass("error"),o=!0),e.before(u),(0,a.default)("._inlineInfoHolder").on("click",n.clearBubbles),o};n.checkPasswordPolicy=function(e){var t=e.val();n.clearBubbles();var r={};r={length:d._(" 8 characters long"),upper:d._(" Uppercase letter"),lower:d._(" Lowercase letter")};var i=n.policyChecker(t),o=w.getEjs("infoBubble").render({policies:n.mapPolicyMessages(i,r)});n.invalidPolicies(i)?e.addClass("error"):e.removeClass("error"),e.before(o),(0,a.default)("._inlineInfoHolder").on("click",n.clearBubbles)};n.validatePassword=function(e){if(e.length===0)return!0;var t=e.val(),r={};r={length:d._("Your password must contain at least 8 characters"),upper:d._("Your password must contain at least 1 uppercase character"),lower:d._("Your password must contain at least 1 lowercase character")};var i=n.policyChecker(t);if(n.clearBubbles(),n.invalidPolicies(i)){var o=w.getEjs("errorBubble").render({policies:n.mapPolicyMessages(i,r)});return e.before(o),(0,a.default)("._inlineErrorHolder").on("click",n.clearBubbles),!1}return!0};n.clearBubbles=function(){var e=(0,a.default)("._inlineErrorHolder"),t=(0,a.default)("._inlineInfoHolder");e.length&&e.remove(),t.length&&t.remove()};n.promiseRealSuccess=function(e,t){t=t||e;var r=a.default.Deferred(),i=function(o,s,l,u){r.rejectWith(t,[o,s,l,u])};return e.done(function(o,s,l){o.success=="0"||o.error?i(l,s,"",o):r.resolveWith(t,[o])}).fail(i),r.promise()};n.doRedirect=function(e,t){t?n._redirect(e+"?"+a.default.param(t)):n._redirect(e)};n._redirect=function(e){window.location.href=e};n.getHostname=function(e){var t=document.createElement("a");return t.href=e,t.hostname};n.doNewTab=function(e){window.open(e)};n.boolToForm=function(e){var t=c.default.rest(arguments);c.default.each(t,function(r){Object.prototype.hasOwnProperty.call(e,r)&&(e[r]=e[r]?1:0)})};n.keepErrorMessageVisible=function(e){hs.statusObj.reset();try{var t=JSON.parse(e.responseText);"error"in t&&"leaveErrorMessage"in t.error&&t.error.leaveErrorMessage&&hs.statusObj.update(t.error.message,"error",!0)}catch{}};n.checkPasswordStrength=function(e,t){var r=new a.default.Deferred;return hs.require("password-validation",function(){var i=hs.util.zxcvbn(e),o={0:"passwordStrengthZero",1:"passwordStrengthOne",2:"passwordStrengthTwo",3:"passwordStrengthThree",4:"passwordStrengthFour"},s=o[i.score];s=s+t,n.recordAction(s,{},1e3).done(n.recordAction(o[i.score],{},1e3).done(r.resolve).fail(r.reject))}),r.promise()};n.dashboardWindowProxy=function(e,t,r){var i=c.default.reduce(e.split("."),function(o,s){return o[s]},window);if(c.default.isFunction(i))return i.apply(r,t)};n.getContextPathUrl=function(){var e=window.location.href.split("/").slice(3).join("/");return e.match(/tabs\?id=\d+/i)&&(e=e.replace(/tabs\?id=\d+/,"tabs")),e};hs.util=hs.util||{};c.default.extend(hs.util,n);j=n});export{x as a,j as b,O as c};
//# sourceMappingURL=chunk-BRMHBYYL.js.map
