import{b as T}from"./chunk-OZL6K2YT.js";import{a as Wt}from"./chunk-NWKOIDHD.js";import{a as K}from"./chunk-JMUJZFCQ.js";import{a as Gt}from"./chunk-GJN5ONR7.js";import{a as Jt}from"./chunk-5M6X2SDJ.js";import{c as f,f as w}from"./chunk-62VJZGPO.js";var Y=f((Nn,De)=>{"use strict";De.exports=function(e,r){return function(){for(var s=new Array(arguments.length),i=0;i<s.length;i++)s[i]=arguments[i];return e.apply(r,s)}}});var m=f((Rn,je)=>{"use strict";var tr=Y(),S=Object.prototype.toString;function ee(t){return S.call(t)==="[object Array]"}function Z(t){return typeof t>"u"}function rr(t){return t!==null&&!Z(t)&&t.constructor!==null&&!Z(t.constructor)&&typeof t.constructor.isBuffer=="function"&&t.constructor.isBuffer(t)}function nr(t){return S.call(t)==="[object ArrayBuffer]"}function sr(t){return typeof FormData<"u"&&t instanceof FormData}function ir(t){var e;return typeof ArrayBuffer<"u"&&ArrayBuffer.isView?e=ArrayBuffer.isView(t):e=t&&t.buffer&&t.buffer instanceof ArrayBuffer,e}function or(t){return typeof t=="string"}function ar(t){return typeof t=="number"}function Ue(t){return t!==null&&typeof t=="object"}function U(t){if(S.call(t)!=="[object Object]")return!1;var e=Object.getPrototypeOf(t);return e===null||e===Object.prototype}function ur(t){return S.call(t)==="[object Date]"}function cr(t){return S.call(t)==="[object File]"}function fr(t){return S.call(t)==="[object Blob]"}function _e(t){return S.call(t)==="[object Function]"}function lr(t){return Ue(t)&&_e(t.pipe)}function dr(t){return typeof URLSearchParams<"u"&&t instanceof URLSearchParams}function pr(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}function hr(){return typeof navigator<"u"&&(navigator.product==="ReactNative"||navigator.product==="NativeScript"||navigator.product==="NS")?!1:typeof window<"u"&&typeof document<"u"}function te(t,e){if(!(t===null||typeof t>"u"))if(typeof t!="object"&&(t=[t]),ee(t))for(var r=0,n=t.length;r<n;r++)e.call(null,t[r],r,t);else for(var s in t)Object.prototype.hasOwnProperty.call(t,s)&&e.call(null,t[s],s,t)}function Q(){var t={};function e(s,i){U(t[i])&&U(s)?t[i]=Q(t[i],s):U(s)?t[i]=Q({},s):ee(s)?t[i]=s.slice():t[i]=s}for(var r=0,n=arguments.length;r<n;r++)te(arguments[r],e);return t}function mr(t,e,r){return te(e,function(s,i){r&&typeof s=="function"?t[i]=tr(s,r):t[i]=s}),t}function yr(t){return t.charCodeAt(0)===65279&&(t=t.slice(1)),t}je.exports={isArray:ee,isArrayBuffer:nr,isBuffer:rr,isFormData:sr,isArrayBufferView:ir,isString:or,isNumber:ar,isObject:Ue,isPlainObject:U,isUndefined:Z,isDate:ur,isFile:cr,isBlob:fr,isFunction:_e,isStream:lr,isURLSearchParams:dr,isStandardBrowserEnv:hr,forEach:te,merge:Q,extend:mr,trim:pr,stripBOM:yr}});var re=f((qn,ke)=>{"use strict";var N=m();function Ie(t){return encodeURIComponent(t).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+").replace(/%5B/gi,"[").replace(/%5D/gi,"]")}ke.exports=function(e,r,n){if(!r)return e;var s;if(n)s=n(r);else if(N.isURLSearchParams(r))s=r.toString();else{var i=[];N.forEach(r,function(o,v){o===null||typeof o>"u"||(N.isArray(o)?v=v+"[]":o=[o],N.forEach(o,function(d){N.isDate(d)?d=d.toISOString():N.isObject(d)&&(d=JSON.stringify(d)),i.push(Ie(v)+"="+Ie(d))}))}),s=i.join("&")}if(s){var a=e.indexOf("#");a!==-1&&(e=e.slice(0,a)),e+=(e.indexOf("?")===-1?"?":"&")+s}return e}});var Le=f((Cn,Be)=>{"use strict";var vr=m();function _(){this.handlers=[]}_.prototype.use=function(e,r,n){return this.handlers.push({fulfilled:e,rejected:r,synchronous:n?n.synchronous:!1,runWhen:n?n.runWhen:null}),this.handlers.length-1};_.prototype.eject=function(e){this.handlers[e]&&(this.handlers[e]=null)};_.prototype.forEach=function(e){vr.forEach(this.handlers,function(n){n!==null&&e(n)})};Be.exports=_});var Fe=f((Hn,Ve)=>{"use strict";var br=m();Ve.exports=function(e,r){br.forEach(e,function(s,i){i!==r&&i.toUpperCase()===r.toUpperCase()&&(e[r]=s,delete e[i])})}});var ne=f((Pn,Me)=>{"use strict";Me.exports=function(e,r,n,s,i){return e.config=r,n&&(e.code=n),e.request=s,e.response=i,e.isAxiosError=!0,e.toJSON=function(){return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:this.config,code:this.code}},e}});var se=f((Dn,Ke)=>{"use strict";var xr=ne();Ke.exports=function(e,r,n,s,i){var a=new Error(e);return xr(a,r,n,s,i)}});var Je=f((Un,ze)=>{"use strict";var gr=se();ze.exports=function(e,r,n){var s=n.config.validateStatus;!n.status||!s||s(n.status)?e(n):r(gr("Request failed with status code "+n.status,n.config,null,n.request,n))}});var We=f((_n,Ge)=>{"use strict";var j=m();Ge.exports=j.isStandardBrowserEnv()?function(){return{write:function(r,n,s,i,a,u){var o=[];o.push(r+"="+encodeURIComponent(n)),j.isNumber(s)&&o.push("expires="+new Date(s).toGMTString()),j.isString(i)&&o.push("path="+i),j.isString(a)&&o.push("domain="+a),u===!0&&o.push("secure"),document.cookie=o.join("; ")},read:function(r){var n=document.cookie.match(new RegExp("(^|;\\s*)("+r+")=([^;]*)"));return n?decodeURIComponent(n[3]):null},remove:function(r){this.write(r,"",Date.now()-864e5)}}}():function(){return{write:function(){},read:function(){return null},remove:function(){}}}()});var Xe=f((jn,$e)=>{"use strict";$e.exports=function(e){return/^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(e)}});var Ze=f((In,Ye)=>{"use strict";Ye.exports=function(e,r){return r?e.replace(/\/+$/,"")+"/"+r.replace(/^\/+/,""):e}});var et=f((kn,Qe)=>{"use strict";var wr=Xe(),Er=Ze();Qe.exports=function(e,r){return e&&!wr(r)?Er(e,r):r}});var rt=f((Bn,tt)=>{"use strict";var ie=m(),Sr=["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"];tt.exports=function(e){var r={},n,s,i;return e&&ie.forEach(e.split(`
`),function(u){if(i=u.indexOf(":"),n=ie.trim(u.substr(0,i)).toLowerCase(),s=ie.trim(u.substr(i+1)),n){if(r[n]&&Sr.indexOf(n)>=0)return;n==="set-cookie"?r[n]=(r[n]?r[n]:[]).concat([s]):r[n]=r[n]?r[n]+", "+s:s}}),r}});var it=f((Ln,st)=>{"use strict";var nt=m();st.exports=nt.isStandardBrowserEnv()?function(){var e=/(msie|trident)/i.test(navigator.userAgent),r=document.createElement("a"),n;function s(i){var a=i;return e&&(r.setAttribute("href",a),a=r.href),r.setAttribute("href",a),{href:r.href,protocol:r.protocol?r.protocol.replace(/:$/,""):"",host:r.host,search:r.search?r.search.replace(/^\?/,""):"",hash:r.hash?r.hash.replace(/^#/,""):"",hostname:r.hostname,port:r.port,pathname:r.pathname.charAt(0)==="/"?r.pathname:"/"+r.pathname}}return n=s(window.location.href),function(a){var u=nt.isString(a)?s(a):a;return u.protocol===n.protocol&&u.host===n.host}}():function(){return function(){return!0}}()});var ae=f((Vn,ot)=>{"use strict";var I=m(),Ar=Je(),Tr=We(),Or=re(),Nr=et(),Rr=rt(),qr=it(),oe=se();ot.exports=function(e){return new Promise(function(n,s){var i=e.data,a=e.headers,u=e.responseType;I.isFormData(i)&&delete a["Content-Type"];var o=new XMLHttpRequest;if(e.auth){var v=e.auth.username||"",A=e.auth.password?unescape(encodeURIComponent(e.auth.password)):"";a.Authorization="Basic "+btoa(v+":"+A)}var d=Nr(e.baseURL,e.url);o.open(e.method.toUpperCase(),Or(d,e.params,e.paramsSerializer),!0),o.timeout=e.timeout;function l(){if(!!o){var g="getAllResponseHeaders"in o?Rr(o.getAllResponseHeaders()):null,b=!u||u==="text"||u==="json"?o.responseText:o.response,q={data:b,status:o.status,statusText:o.statusText,headers:g,config:e,request:o};Ar(n,s,q),o=null}}if("onloadend"in o?o.onloadend=l:o.onreadystatechange=function(){!o||o.readyState!==4||o.status===0&&!(o.responseURL&&o.responseURL.indexOf("file:")===0)||setTimeout(l)},o.onabort=function(){!o||(s(oe("Request aborted",e,"ECONNABORTED",o)),o=null)},o.onerror=function(){s(oe("Network Error",e,null,o)),o=null},o.ontimeout=function(){var b="timeout of "+e.timeout+"ms exceeded";e.timeoutErrorMessage&&(b=e.timeoutErrorMessage),s(oe(b,e,e.transitional&&e.transitional.clarifyTimeoutError?"ETIMEDOUT":"ECONNABORTED",o)),o=null},I.isStandardBrowserEnv()){var c=(e.withCredentials||qr(d))&&e.xsrfCookieName?Tr.read(e.xsrfCookieName):void 0;c&&(a[e.xsrfHeaderName]=c)}"setRequestHeader"in o&&I.forEach(a,function(b,q){typeof i>"u"&&q.toLowerCase()==="content-type"?delete a[q]:o.setRequestHeader(q,b)}),I.isUndefined(e.withCredentials)||(o.withCredentials=!!e.withCredentials),u&&u!=="json"&&(o.responseType=e.responseType),typeof e.onDownloadProgress=="function"&&o.addEventListener("progress",e.onDownloadProgress),typeof e.onUploadProgress=="function"&&o.upload&&o.upload.addEventListener("progress",e.onUploadProgress),e.cancelToken&&e.cancelToken.promise.then(function(b){!o||(o.abort(),s(b),o=null)}),i||(i=null),o.send(i)})}});var B=f((Fn,ct)=>{"use strict";var p=m(),at=Fe(),Cr=ne(),Hr={"Content-Type":"application/x-www-form-urlencoded"};function ut(t,e){!p.isUndefined(t)&&p.isUndefined(t["Content-Type"])&&(t["Content-Type"]=e)}function Pr(){var t;return typeof XMLHttpRequest<"u"?t=ae():typeof process<"u"&&Object.prototype.toString.call(process)==="[object process]"&&(t=ae()),t}function Dr(t,e,r){if(p.isString(t))try{return(e||JSON.parse)(t),p.trim(t)}catch(n){if(n.name!=="SyntaxError")throw n}return(r||JSON.stringify)(t)}var k={transitional:{silentJSONParsing:!0,forcedJSONParsing:!0,clarifyTimeoutError:!1},adapter:Pr(),transformRequest:[function(e,r){return at(r,"Accept"),at(r,"Content-Type"),p.isFormData(e)||p.isArrayBuffer(e)||p.isBuffer(e)||p.isStream(e)||p.isFile(e)||p.isBlob(e)?e:p.isArrayBufferView(e)?e.buffer:p.isURLSearchParams(e)?(ut(r,"application/x-www-form-urlencoded;charset=utf-8"),e.toString()):p.isObject(e)||r&&r["Content-Type"]==="application/json"?(ut(r,"application/json"),Dr(e)):e}],transformResponse:[function(e){var r=this.transitional,n=r&&r.silentJSONParsing,s=r&&r.forcedJSONParsing,i=!n&&this.responseType==="json";if(i||s&&p.isString(e)&&e.length)try{return JSON.parse(e)}catch(a){if(i)throw a.name==="SyntaxError"?Cr(a,this,"E_JSON_PARSE"):a}return e}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,validateStatus:function(e){return e>=200&&e<300}};k.headers={common:{Accept:"application/json, text/plain, */*"}};p.forEach(["delete","get","head"],function(e){k.headers[e]={}});p.forEach(["post","put","patch"],function(e){k.headers[e]=p.merge(Hr)});ct.exports=k});var lt=f((Mn,ft)=>{"use strict";var Ur=m(),_r=B();ft.exports=function(e,r,n){var s=this||_r;return Ur.forEach(n,function(a){e=a.call(s,e,r)}),e}});var ue=f((Kn,dt)=>{"use strict";dt.exports=function(e){return!!(e&&e.__CANCEL__)}});var mt=f((zn,ht)=>{"use strict";var pt=m(),ce=lt(),jr=ue(),Ir=B();function fe(t){t.cancelToken&&t.cancelToken.throwIfRequested()}ht.exports=function(e){fe(e),e.headers=e.headers||{},e.data=ce.call(e,e.data,e.headers,e.transformRequest),e.headers=pt.merge(e.headers.common||{},e.headers[e.method]||{},e.headers),pt.forEach(["delete","get","head","post","put","patch","common"],function(s){delete e.headers[s]});var r=e.adapter||Ir.adapter;return r(e).then(function(s){return fe(e),s.data=ce.call(e,s.data,s.headers,e.transformResponse),s},function(s){return jr(s)||(fe(e),s&&s.response&&(s.response.data=ce.call(e,s.response.data,s.response.headers,e.transformResponse))),Promise.reject(s)})}});var le=f((Jn,yt)=>{"use strict";var h=m();yt.exports=function(e,r){r=r||{};var n={},s=["url","method","data"],i=["headers","auth","proxy","params"],a=["baseURL","transformRequest","transformResponse","paramsSerializer","timeout","timeoutMessage","withCredentials","adapter","responseType","xsrfCookieName","xsrfHeaderName","onUploadProgress","onDownloadProgress","decompress","maxContentLength","maxBodyLength","maxRedirects","transport","httpAgent","httpsAgent","cancelToken","socketPath","responseEncoding"],u=["validateStatus"];function o(l,c){return h.isPlainObject(l)&&h.isPlainObject(c)?h.merge(l,c):h.isPlainObject(c)?h.merge({},c):h.isArray(c)?c.slice():c}function v(l){h.isUndefined(r[l])?h.isUndefined(e[l])||(n[l]=o(void 0,e[l])):n[l]=o(e[l],r[l])}h.forEach(s,function(c){h.isUndefined(r[c])||(n[c]=o(void 0,r[c]))}),h.forEach(i,v),h.forEach(a,function(c){h.isUndefined(r[c])?h.isUndefined(e[c])||(n[c]=o(void 0,e[c])):n[c]=o(void 0,r[c])}),h.forEach(u,function(c){c in r?n[c]=o(e[c],r[c]):c in e&&(n[c]=o(void 0,e[c]))});var A=s.concat(i).concat(a).concat(u),d=Object.keys(e).concat(Object.keys(r)).filter(function(c){return A.indexOf(c)===-1});return h.forEach(d,v),n}});var vt=f((Gn,kr)=>{kr.exports={name:"axios",version:"0.21.4",description:"Promise based HTTP client for the browser and node.js",main:"index.js",scripts:{test:"grunt test",start:"node ./sandbox/server.js",build:"NODE_ENV=production grunt build",preversion:"npm test",version:"npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json",postversion:"git push && git push --tags",examples:"node ./examples/server.js",coveralls:"cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js",fix:"eslint --fix lib/**/*.js"},repository:{type:"git",url:"https://github.com/axios/axios.git"},keywords:["xhr","http","ajax","promise","node"],author:"Matt Zabriskie",license:"MIT",bugs:{url:"https://github.com/axios/axios/issues"},homepage:"https://axios-http.com",devDependencies:{coveralls:"^3.0.0","es6-promise":"^4.2.4",grunt:"^1.3.0","grunt-banner":"^0.6.0","grunt-cli":"^1.2.0","grunt-contrib-clean":"^1.1.0","grunt-contrib-watch":"^1.0.0","grunt-eslint":"^23.0.0","grunt-karma":"^4.0.0","grunt-mocha-test":"^0.13.3","grunt-ts":"^6.0.0-beta.19","grunt-webpack":"^4.0.2","istanbul-instrumenter-loader":"^1.0.0","jasmine-core":"^2.4.1",karma:"^6.3.2","karma-chrome-launcher":"^3.1.0","karma-firefox-launcher":"^2.1.0","karma-jasmine":"^1.1.1","karma-jasmine-ajax":"^0.1.13","karma-safari-launcher":"^1.0.0","karma-sauce-launcher":"^4.3.6","karma-sinon":"^1.0.5","karma-sourcemap-loader":"^0.3.8","karma-webpack":"^4.0.2","load-grunt-tasks":"^3.5.2",minimist:"^1.2.0",mocha:"^8.2.1",sinon:"^4.5.0","terser-webpack-plugin":"^4.2.3",typescript:"^4.0.5","url-search-params":"^0.10.0",webpack:"^4.44.2","webpack-dev-server":"^3.11.0"},browser:{"./lib/adapters/http.js":"./lib/adapters/xhr.js"},jsdelivr:"dist/axios.min.js",unpkg:"dist/axios.min.js",typings:"./index.d.ts",dependencies:{"follow-redirects":"^1.14.0"},bundlesize:[{path:"./dist/axios.min.js",threshold:"5kB"}]}});var Et=f((Wn,wt)=>{"use strict";var xt=vt(),de={};["object","boolean","number","function","string","symbol"].forEach(function(t,e){de[t]=function(n){return typeof n===t||"a"+(e<1?"n ":" ")+t}});var bt={},Br=xt.version.split(".");function gt(t,e){for(var r=e?e.split("."):Br,n=t.split("."),s=0;s<3;s++){if(r[s]>n[s])return!0;if(r[s]<n[s])return!1}return!1}de.transitional=function(e,r,n){var s=r&&gt(r);function i(a,u){return"[Axios v"+xt.version+"] Transitional option '"+a+"'"+u+(n?". "+n:"")}return function(a,u,o){if(e===!1)throw new Error(i(u," has been removed in "+r));return s&&!bt[u]&&(bt[u]=!0,console.warn(i(u," has been deprecated since v"+r+" and will be removed in the near future"))),e?e(a,u,o):!0}};function Lr(t,e,r){if(typeof t!="object")throw new TypeError("options must be an object");for(var n=Object.keys(t),s=n.length;s-- >0;){var i=n[s],a=e[i];if(a){var u=t[i],o=u===void 0||a(u,i,t);if(o!==!0)throw new TypeError("option "+i+" must be "+o);continue}if(r!==!0)throw Error("Unknown option "+i)}}wt.exports={isOlderVersion:gt,assertOptions:Lr,validators:de}});var Rt=f(($n,Nt)=>{"use strict";var Tt=m(),Vr=re(),St=Le(),At=mt(),L=le(),Ot=Et(),R=Ot.validators;function C(t){this.defaults=t,this.interceptors={request:new St,response:new St}}C.prototype.request=function(e){typeof e=="string"?(e=arguments[1]||{},e.url=arguments[0]):e=e||{},e=L(this.defaults,e),e.method?e.method=e.method.toLowerCase():this.defaults.method?e.method=this.defaults.method.toLowerCase():e.method="get";var r=e.transitional;r!==void 0&&Ot.assertOptions(r,{silentJSONParsing:R.transitional(R.boolean,"1.0.0"),forcedJSONParsing:R.transitional(R.boolean,"1.0.0"),clarifyTimeoutError:R.transitional(R.boolean,"1.0.0")},!1);var n=[],s=!0;this.interceptors.request.forEach(function(l){typeof l.runWhen=="function"&&l.runWhen(e)===!1||(s=s&&l.synchronous,n.unshift(l.fulfilled,l.rejected))});var i=[];this.interceptors.response.forEach(function(l){i.push(l.fulfilled,l.rejected)});var a;if(!s){var u=[At,void 0];for(Array.prototype.unshift.apply(u,n),u=u.concat(i),a=Promise.resolve(e);u.length;)a=a.then(u.shift(),u.shift());return a}for(var o=e;n.length;){var v=n.shift(),A=n.shift();try{o=v(o)}catch(d){A(d);break}}try{a=At(o)}catch(d){return Promise.reject(d)}for(;i.length;)a=a.then(i.shift(),i.shift());return a};C.prototype.getUri=function(e){return e=L(this.defaults,e),Vr(e.url,e.params,e.paramsSerializer).replace(/^\?/,"")};Tt.forEach(["delete","get","head","options"],function(e){C.prototype[e]=function(r,n){return this.request(L(n||{},{method:e,url:r,data:(n||{}).data}))}});Tt.forEach(["post","put","patch"],function(e){C.prototype[e]=function(r,n,s){return this.request(L(s||{},{method:e,url:r,data:n}))}});Nt.exports=C});var he=f((Xn,qt)=>{"use strict";function pe(t){this.message=t}pe.prototype.toString=function(){return"Cancel"+(this.message?": "+this.message:"")};pe.prototype.__CANCEL__=!0;qt.exports=pe});var Ht=f((Yn,Ct)=>{"use strict";var Fr=he();function V(t){if(typeof t!="function")throw new TypeError("executor must be a function.");var e;this.promise=new Promise(function(s){e=s});var r=this;t(function(s){r.reason||(r.reason=new Fr(s),e(r.reason))})}V.prototype.throwIfRequested=function(){if(this.reason)throw this.reason};V.source=function(){var e,r=new V(function(s){e=s});return{token:r,cancel:e}};Ct.exports=V});var Dt=f((Zn,Pt)=>{"use strict";Pt.exports=function(e){return function(n){return e.apply(null,n)}}});var _t=f((Qn,Ut)=>{"use strict";Ut.exports=function(e){return typeof e=="object"&&e.isAxiosError===!0}});var kt=f((es,me)=>{"use strict";var jt=m(),Mr=Y(),F=Rt(),Kr=le(),zr=B();function It(t){var e=new F(t),r=Mr(F.prototype.request,e);return jt.extend(r,F.prototype,e),jt.extend(r,e),r}var y=It(zr);y.Axios=F;y.create=function(e){return It(Kr(y.defaults,e))};y.Cancel=he();y.CancelToken=Ht();y.isCancel=ue();y.all=function(e){return Promise.all(e)};y.spread=Dt();y.isAxiosError=_t();me.exports=y;me.exports.default=y});var Lt=f((ts,Bt)=>{Bt.exports=kt()});var x=w(Jt());var P=w(Gt());var Ee=w(K());var Se=w(K());var z=typeof window>"u"?{}:window,Ae=()=>(z.__doNotUse=z.__doNotUse||{},z.__doNotUse),E=t=>Ae()[t],O=(t,e)=>{let r=Ae();return r[t]=e,E(t)};var Ce=w(Wt());var Yt=new Set(["@@redux/INIT","@@INIT"]),Te=t=>Yt.has(t);var J=(t=[],e)=>{try{if(e==null||!t.length)return e;let[r,...n]=t;return J(n,e[r])}catch{return}};var Oe=(t,e)=>{if(t==null)throw new Error(`

Missing Event Type`);let r=t.split(/[/]/),n=J(r,e);if(n==null)throw new Error(`

Invalid handler: ${t}`);return n};var Ne=(t,e,r)=>{};var Re=(t,e)=>(r={},n={})=>{let{type:s,payload:i=[]}=n;var a=r;try{if(Te(s))return r;a=Oe(s,e).call(null,r,...i)}catch(u){Ne(t,u,n)}return a};var qe=typeof window<"u"?window.__REDUX_DEVTOOLS_EXTENSION__:()=>{},He=(t,e,r)=>{let n=Re(t,e),s=qe&&qe({name:t}),i=(0,Ce.createStore)(n,r,s);return{store:i,getState:i.getState.bind(i),subscribe:i.subscribe.bind(i),dispatch:(a,...u)=>i.dispatch({type:a,payload:u})}};var Pe={set:{actionHistory:(t,e)=>e,actionHistoryValue:(t,e,r)=>({...t,[e]:r})},delete:{actionHistoryValue:(t,e)=>{let r={...t};return delete r[e],r}}};var G="fe-pg-lib-action-history",Zt=window.hs?.memberActionHistory||{},W=E(G);W||(W=O(G,He(G,Pe,Zt)));var{store:Qt,dispatch:$,getState:X,subscribe:er}=W;var D=t=>X()[t];var Vt=w(Lt()),ye=E("axios")||O("axios",Vt.default);var ve="production",be="staging",xe="dev",Ft=()=>{let t=Gr(),e=String(Jr().env||t.TARGET||t.NODE_ENV).toLowerCase();return e.includes("dev")?xe:e.includes("stag")?be:ve},Jr=()=>typeof hs<"u"?hs:{},Gr=()=>typeof process<"u"&&process.env?process.env:{};var M=class{constructor(){this.queue=[],this.isTaskInProgress=!1}schedule(e){return new Promise((r,n)=>{this.queue.push({task:e,resolve:r,reject:n}),this.execute()})}execute(){if(this.isTaskInProgress)return;let e=this.queue.shift();!e||(this.isTaskInProgress=!0,e.task().then(r=>{e.resolve(r),this.isTaskInProgress=!1,this.execute()}).catch(r=>{e.reject(r),this.isTaskInProgress=!1,this.execute()}))}};var Wr={[xe]:"https://dashboard.local.hootdev.com",[be]:"https://staging.hootsuite.com",[ve]:"https://hootsuite.com"},Mt=Wr[Ft()],ge=()=>E("action-history-scheduler");ge()||O("action-history-scheduler",new M);var H=async(t,e)=>(await $("set/actionHistoryValue",t,e),window.hs?.memberActionHistory&&(window.hs.memberActionHistory[t]=e),ge().schedule(()=>ye.post(Mt+"/ajax/member/store-action-history-value",{n:t,v:e,csrfToken:window.hs?.csrfToken},{withCredentials:!0})).then(()=>!0)),we=async t=>(await $("delete/actionHistoryValue",t),window.hs?.memberActionHistory&&delete window.hs.memberActionHistory[t],ge().schedule(()=>ye.post(Mt+"/ajax/member/remove-action-history-value",{n:t,csrfToken:window.hs?.csrfToken},{withCredentials:!0})).then(()=>!0));var Kt=w(K());var zt={getSnCollection:function(){return hs&&hs.socialNetworks?hs.socialNetworks:{}},getSnTypeUniqList:function(){let t=this.getSnCollection();return x.default.chain(t).values().pluck("type").uniq().filter(e=>e!==void 0).value()},hasTwitterAccount:function(){return!!x.default.size(hs.socialNetworksKeyedByType[T.c.TWITTER])},hasFacebookAccount:function(){return!!x.default.size(hs.socialNetworksKeyedByType[T.c.FACEBOOK])||!!x.default.size(hs.socialNetworksKeyedByType[T.c.FACEBOOKPAGE])||!!x.default.size(hs.socialNetworksKeyedByType[T.c.FACEBOOKGROUP])},hasInstagramAccount:function(){return!!x.default.size(hs.socialNetworksKeyedByType[T.c.INSTAGRAM])},checkUserEmail:function(){var t=hs.memberEmail||!1;return t?!hs.memberIsEmailConfirmed:!1},hasSignedUpAfterDate:function(t){var e=new Date(hs.memberSignupDate);return e-t>0},getTrialDuration:function(){let t=hs.memberTrialStartDate,e=hs.memberTrialEndDate;if(!t||!e)return-1;let r=Date.parse(t),n=Date.parse(e),s=864e5,i=Math.floor((n-r)/s);return i<2?0:i},updateMemberData:function(t){x.default.each(t,function(e,r){var n="member"+r.charAt(0).toUpperCase()+r.slice(1);r=="fullName"?hs.memberName=e:r==="defaultTimezone"?hs.timezoneName=e:hs[n]&&(hs[n]=e)})},getActionHistory:function(){return hs&&hs.memberActionHistory?hs.memberActionHistory:{}},getActionHistoryValue:function(t){return P.default.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")?D(t):hs&&hs.memberActionHistory&&hs.memberActionHistory[t]?hs.memberActionHistory[t]:null},storeActionHistoryValue:function(t,e){return P.default.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")?H(t,e):!t||e===void 0?null:(hs&&hs.memberActionHistory&&(e=parseInt(e)?parseInt(e):e,e=e.toString()=="true"?!0:e.toString()=="false"?!1:e,hs.memberActionHistory[t]=e),ajaxCall({url:"/ajax/member/store-action-history-value",type:"POST",data:{n:t,v:e}},"qm"))},incrementActionHistoryValue:function(t){if(P.default.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")){var e=D(t),r=parseInt(e);if(e===void 0)return H(t,1);if(isFinite(r))return H(t,r+1)}else{if(!t)return;hs&&hs.memberActionHistory&&(hs.memberActionHistory[t]=parseInt(hs.memberActionHistory[t])?parseInt(hs.memberActionHistory[t])+1:1),ajaxCall({url:"/ajax/member/increment-action-history-value",type:"POST",data:{n:t}},"qm")}},removeActionHistoryValue:function(t){if(P.default.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE"))we(t);else{if(!t)return;hs&&hs.memberActionHistory&&delete hs.memberActionHistory[t],ajaxCall({url:"/ajax/member/remove-action-history-value?n="+t,type:"DELETE"},"qm")}}};hs.memberUtil=hs.memberUtil||zt;var Ss=zt;export{Lt as a,Ss as b};
//# sourceMappingURL=chunk-XUS6IAYG.js.map