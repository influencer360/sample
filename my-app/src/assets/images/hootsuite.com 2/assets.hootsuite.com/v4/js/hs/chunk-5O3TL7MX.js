import{a as r}from"./chunk-5M6X2SDJ.js";import{f as i}from"./chunk-62VJZGPO.js";var n=i(r());hs.recaptcha={};hs.recaptcha.onLoad=function(){window.grecaptcha.render("recaptchaWidgetV2",{sitekey:hs.reCaptchaV2PublicKey}),$(".recaptchaWidgetLoading").remove()};hs.recaptcha.init=function(c){if($("#recaptchaWidget").length){var t=document.createElement("script");t.innerHTML="var recaptchaCallback = hs.recaptcha.onLoad;",t.defer=!0,document.body.appendChild(t);var a=document.createElement("script");a.src="https://www.google.com/recaptcha/api.js?onload=recaptchaCallback&render=explicit",a.defer=!0,document.body.appendChild(a)}$("._recaptchaReload").click(function(e){e.preventDefault();var o=this;n.default.debounce(function(){window.Recaptcha.reload(),typeof c<"u"&&c.setSubmitBtnEnabled(!1,o)},100)()}),$("._recaptchaSwitchType").click(function(e){e.preventDefault(),window.Recaptcha.switch_type($(this).data("type"))}),$("._recaptchaShowHelp").click(function(e){e.preventDefault(),window.Recaptcha.showhelp()})};
//# sourceMappingURL=chunk-5O3TL7MX.js.map