import{a as s}from"./chunk-H3NBBSOA.js";import{a as o,b as p}from"./chunk-5D3K6GYC.js";import{b as t,c}from"./chunk-RBJWJTV5.js";import{a as f}from"./chunk-5M6X2SDJ.js";import{f as a}from"./chunk-62VJZGPO.js";var n=a(f());c();p();var u={_extractMessage:function(r,e){var i=n.default.isString(e)?e:t.c.ERROR_GENERIC;return r&&r.message?i=r.message:r&&r.errorMessage?i=r.errorMessage:r&&r.errorMsg&&(i=r.errorMsg),i},displayError:function(r){var e=this._extractMessage(r);o.isFeatureEnabled("CUXF_INCREASE_TOAST_TIME")&&e.length>90?s.update(e,"error",!0,12e3):s.update(e,"error",!0)},displayErrorIfDefined:function(r){this._extractMessage(r,"")!==""&&this.displayError(r)},displayWarning:function(r){s.update(this._extractMessage(r),"warning",!0)},displayLoading:function(){s.update(t.c.LOADING,"info",!0)},displaySuccess:function(){s.update(t._("Success!"),"success",!0)}};n.default.bindAll(u,"displayError","displayWarning","displayErrorIfDefined");var m=u;export{m as a};
//# sourceMappingURL=chunk-ETGVIKWH.js.map
