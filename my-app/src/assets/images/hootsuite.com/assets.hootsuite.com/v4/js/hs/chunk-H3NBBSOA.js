import{a as c,b as A}from"./chunk-5D3K6GYC.js";import{a as b}from"./chunk-JRESDEDW.js";import{b as v}from"./chunk-INSRYSWJ.js";import{a as H}from"./chunk-5M6X2SDJ.js";import{f as r}from"./chunk-62VJZGPO.js";var t=r(b()),d=r(H());A();var e=r(v());function T(){var s=this;this.defaultHideTimeout=c.isFeatureEnabled("CUXF_INCREASE_TOAST_TIME")?6e3:5e3,this.errorClass="error",this.warningClass="warning",this.successClass="success",this.infoClass="info",this.animationClass="animated bounceIn",this.animatedTypes=["error","warning","success"],this.messageContent="",this.type="info",this.isAutoHide=!1,this.hideTimeout=this.defaultHideTimeout,this.timeoutRef=null,this.persist=!1,this.selector="#statusContainer",this.disabled=!1,this.disable=function(){this.disabled=!0,(0,t.default)(this.selector).hide()},this.enable=function(){this.disabled=!1},this.update=function(C,a,u,o,n,l){if(!this.disabled&&!this.persist){n===void 0&&(n=!1,this.persist=!1),a&&(this.type=a),u&&(this.isAutoHide=u),o&&(this.hideTimeout=o),this.messageContent=C,n&&(this.persist=!0,this.isAutoHide=!0),l?this.selector=l:this.selector="#statusContainer";var h=this[this.type+"Class"];d.default.contains(this.animatedTypes,this.type)&&(h+=" "+this.animationClass);var p=function(i){var g=(0,t.default)(i.target),f=g.data();switch(f.action){case"recoverStream":e.default.emit("statusObject:extraAction:recoverStream");break;case"internalLink":e.default.emit("statusObject:extraAction:internalLink",f.url);break}return!1};(0,t.default)(this.selector).attr("role","alert").attr("aria-live","polite").find("._statusMsgContent").empty().html(this.messageContent).end().find("div").removeClass(this.errorClass+" "+this.warningClass+" "+this.successClass+" "+this.infoClass+" "+this.animationClass).addClass(h).end().show().bind("click",function(i){(0,t.default)(i.target).is("._extraAction")&&p(i),i.target.tagName!="A"&&i.preventDefault(),s.timeoutRef&&clearTimeout(s.timeoutRef),s.reset()}).find(".icon-13").hide(),(0,t.default)(this.selector).find("._statusMessage").addClass("relativeClose").removeClass("hasClose"),o>this.defaultHideTimeout&&((0,t.default)(this.selector).find(".icon-13").css("display","inline-block"),(0,t.default)(this.selector).find("._statusMessage").addClass("hasClose")),this.isAutoHide===!0&&(s.timeoutRef&&clearTimeout(s.timeoutRef),s.timeoutRef=setTimeout(function(){s.complete(),s.reset()},this.hideTimeout))}},this.complete=function(){this.persist=!1},this.reset=function(){this.persist||((0,t.default)(this.selector).hide().removeAttr("role").removeAttr("aria-live").find("div").removeClass(this.errorClass+" "+this.warningClass+" "+this.successClass+" "+this.infoClass+" "+this.animationClass).end().find("._statusMsgContent").empty().end().stop().unbind("click").find(".icon-13").hide(),(0,t.default)(this.selector).find("._statusMessage").removeClass("hasClose"),this.messageContent="",this.type="info",this.isAutoHide=!1,this.hideTimeout=this.defaultHideTimeout,this.timeoutRef=null,this.selector="#statusContainer")}}var m=new T;hs.statusObj=m;e.default.on("status:success",function(s){s.autoHideAfter&&(s.autoHide=!0),hs.statusObj.update(s.message,"success",s.autoHide,s.autoHideAfter,s.persist,s.selector)});e.default.on("status:error",function(s){hs.statusObj.update(s.message,"error",s.autoHide,s.autoHideAfter,s.persist,s.selector)});e.default.on("status:info",function(s){s.autoHideAfter&&(s.autoHide=!0),hs.statusObj.update(s.message,"info",s.autoHide,s.autoHideAfter,s.persist,s.selector)});e.default.on("status:warning",function(s){s.autoHideAfter&&(s.autoHide=!0),hs.statusObj.update(s.message,"warning",s.autoHide,s.autoHideAfter,s.persist,s.selector)});e.default.on("status:reset",function(){hs.statusObj.reset()});var w=m;export{w as a};
//# sourceMappingURL=chunk-H3NBBSOA.js.map
