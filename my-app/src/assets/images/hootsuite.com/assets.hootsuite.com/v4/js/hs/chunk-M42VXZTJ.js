import{c as P}from"./chunk-62VJZGPO.js";var A=P(r=>{"use strict";var t=typeof Symbol=="function"&&Symbol.for,O=t?Symbol.for("react.element"):60103,T=t?Symbol.for("react.portal"):60106,u=t?Symbol.for("react.fragment"):60107,s=t?Symbol.for("react.strict_mode"):60108,i=t?Symbol.for("react.profiler"):60114,y=t?Symbol.for("react.provider"):60109,p=t?Symbol.for("react.context"):60110,g=t?Symbol.for("react.async_mode"):60111,l=t?Symbol.for("react.concurrent_mode"):60111,a=t?Symbol.for("react.forward_ref"):60112,m=t?Symbol.for("react.suspense"):60113,z=t?Symbol.for("react.suspense_list"):60120,S=t?Symbol.for("react.memo"):60115,d=t?Symbol.for("react.lazy"):60116,L=t?Symbol.for("react.block"):60121,V=t?Symbol.for("react.fundamental"):60117,W=t?Symbol.for("react.responder"):60118,K=t?Symbol.for("react.scope"):60119;function o(e){if(typeof e=="object"&&e!==null){var n=e.$$typeof;switch(n){case O:switch(e=e.type,e){case g:case l:case u:case i:case s:case m:return e;default:switch(e=e&&e.$$typeof,e){case p:case a:case d:case S:case y:return e;default:return n}}case T:return n}}}function _(e){return o(e)===l}r.AsyncMode=g;r.ConcurrentMode=l;r.ContextConsumer=p;r.ContextProvider=y;r.Element=O;r.ForwardRef=a;r.Fragment=u;r.Lazy=d;r.Memo=S;r.Portal=T;r.Profiler=i;r.StrictMode=s;r.Suspense=m;r.isAsyncMode=function(e){return _(e)||o(e)===g};r.isConcurrentMode=_;r.isContextConsumer=function(e){return o(e)===p};r.isContextProvider=function(e){return o(e)===y};r.isElement=function(e){return typeof e=="object"&&e!==null&&e.$$typeof===O};r.isForwardRef=function(e){return o(e)===a};r.isFragment=function(e){return o(e)===u};r.isLazy=function(e){return o(e)===d};r.isMemo=function(e){return o(e)===S};r.isPortal=function(e){return o(e)===T};r.isProfiler=function(e){return o(e)===i};r.isStrictMode=function(e){return o(e)===s};r.isSuspense=function(e){return o(e)===m};r.isValidElementType=function(e){return typeof e=="string"||typeof e=="function"||e===u||e===l||e===i||e===s||e===m||e===z||typeof e=="object"&&e!==null&&(e.$$typeof===d||e.$$typeof===S||e.$$typeof===y||e.$$typeof===p||e.$$typeof===a||e.$$typeof===V||e.$$typeof===W||e.$$typeof===K||e.$$typeof===L)};r.typeOf=o});var N=P((ee,E)=>{"use strict";E.exports=A()});var X=P((re,C)=>{"use strict";var w=N(),Y={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},B={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},G={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},D={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},x={};x[w.ForwardRef]=G;x[w.Memo]=D;function F(e){return w.isMemo(e)?D:x[e.$$typeof]||Y}var H=Object.defineProperty,J=Object.getOwnPropertyNames,R=Object.getOwnPropertySymbols,Q=Object.getOwnPropertyDescriptor,U=Object.getPrototypeOf,h=Object.prototype;function I(e,n,b){if(typeof n!="string"){if(h){var $=U(n);$&&$!==h&&I(e,$,b)}var c=J(n);R&&(c=c.concat(R(n)));for(var j=F(e),M=F(n),v=0;v<c.length;++v){var f=c[v];if(!B[f]&&!(b&&b[f])&&!(M&&M[f])&&!(j&&j[f])){var q=Q(n,f);try{H(e,f,q)}catch{}}}}return e}C.exports=I});export{N as a,X as b};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
//# sourceMappingURL=chunk-M42VXZTJ.js.map