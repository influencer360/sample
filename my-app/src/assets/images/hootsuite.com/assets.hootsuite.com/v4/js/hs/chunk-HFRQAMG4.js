import{a as T}from"./chunk-FRUME2CC.js";import{c}from"./chunk-62VJZGPO.js";var y=c((q,w)=>{"use strict";w.exports={isWindow:function(o){return o&&typeof o=="object"&&"setInterval"in o},parseCss:function(o,t){var e=window.getComputedStyle(o);return parseInt(e.getPropertyValue(t),10)||0},getRelativeOffset:function(o,t){var e,n,i,r,f,a,g,d=o.style.position,S=o,p={};d==="static"&&(o.style.position="relative");var v=o.getBoundingClientRect();return f={left:v.left,top:v.top},i=o.style.top,a=o.style.left,g=(d==="absolute"||d==="fixed")&&(i+a).indexOf("auto")>-1,g?(e=S.position(),r=e.top,n=e.left):(r=parseFloat(i)||0,n=parseFloat(a)||0),t.top!=null&&(p.top=t.top-f.top+r),t.left!=null&&(p.left=t.left-f.left+n),p}}});var m=c((V,h)=>{"use strict";h.exports={provisioning:{initialIndex:2e3,ranges:{blocker:2e3,focusOverlay:-500}},menu:67677,tooltip:1070}});var j=c((W,C)=>{"use strict";var E=T(),x=y(),L=m(),u=function(t){return t&&t.ownerDocument?t.ownerDocument:document.body},s=function(t){return u(t).defaultView.getComputedStyle(t,null)},l=function(t){if(window.jQuery)return window.jQuery(t).offset();var e=u(t).documentElement,n={top:0,left:0};return typeof t.getBoundingClientRect<"u"&&(n=t.getBoundingClientRect()),{top:n.top+window.pageYOffset-e.clientTop,left:n.left+window.pageXOffset-e.clientLeft}},B=function(t,e){if(e===document.body)return l(t);if(window.jQuery)return window.jQuery(t).position();var n=0,i={top:0,left:0};return s(t).position==="fixed"?n=t.getBoundingClientRect():(e||(e=I(t)),n=l(t),e.nodeName!=="HTML"&&(i=l(e)),i.top+=parseInt(s(e).borderTopWidth,10),i.left+=parseInt(s(e).borderLeftWidth,10)),{top:n.top-i.top-parseInt(s(t).marginTop,10),left:n.left-i.left-parseInt(s(t).marginLeft,10)}},I=function(t){for(var e=u(t).documentElement,n=t.offsetParent||e;n&&n.nodeName!=="HTML"&&s(n).position==="static";)n=n.offsetParent;return n||e},H=function(t){if(x.isWindow(t))return{height:window.innerHeight,width:window.innerWidth,scrollTop:window.pageYOffset,scrollLeft:window.pageXOffset,offset:{top:0,left:0}};var e=t.getBoundingClientRect();return{height:e.height,width:e.width,scrollLeft:t.scrollLeft,scrollTop:t.scrollTop,offset:{top:e.top,left:e.left}}},O=function(t,e){e=e||0;var n=window.getComputedStyle(t,null).getPropertyValue("height");return t.scrollTop+parseInt(n)+e>=t.scrollHeight},P=function(t){return t.offsetParent===null},D=function(t){var e=L.provisioning.initialIndex,n=window.provisionedIndexValue||e;return n+=2,window.provisionedIndexValue=n,t&&(n+=t),n},R=function(t,e){var n=(t.document||t.ownerDocument).querySelectorAll(e),i=void 0,r=t;do for(i=n.length;--i>=0&&n.item(i)!==r;);while(i<0&&(r=r.parentElement));return r},b={ownerDocument:u,getComputedStyles:s,getOffset:l,getPosition:B,offsetParent:I,getDimensions:H,isElementScrolledToBottom:O,isElementHidden:P,provisionIndex:D,closest:R};C.exports=E({},b,x)});export{m as a,j as b};
//# sourceMappingURL=chunk-HFRQAMG4.js.map
