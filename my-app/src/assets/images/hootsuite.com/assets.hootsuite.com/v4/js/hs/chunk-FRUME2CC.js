import{c as i}from"./chunk-62VJZGPO.js";var j=i((g,u)=>{"use strict";var s=Object.getOwnPropertySymbols,l=Object.prototype.hasOwnProperty,b=Object.prototype.propertyIsEnumerable;function p(t){if(t==null)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(t)}function O(){try{if(!Object.assign)return!1;var t=new String("abc");if(t[5]="de",Object.getOwnPropertyNames(t)[0]==="5")return!1;for(var c={},r=0;r<10;r++)c["_"+String.fromCharCode(r)]=r;var a=Object.getOwnPropertyNames(c).map(function(e){return c[e]});if(a.join("")!=="0123456789")return!1;var n={};return"abcdefghijklmnopqrst".split("").forEach(function(e){n[e]=e}),Object.keys(Object.assign({},n)).join("")==="abcdefghijklmnopqrst"}catch{return!1}}u.exports=O()?Object.assign:function(t,c){for(var r,a=p(t),n,e=1;e<arguments.length;e++){r=Object(arguments[e]);for(var f in r)l.call(r,f)&&(a[f]=r[f]);if(s){n=s(r);for(var o=0;o<n.length;o++)b.call(r,n[o])&&(a[n[o]]=r[n[o]])}}return a}});export{j as a};
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
//# sourceMappingURL=chunk-FRUME2CC.js.map
