import{b as L}from"./chunk-5M6X2SDJ.js";import{c as _}from"./chunk-62VJZGPO.js";var m=_((b,y)=>{"use strict";function a(h,e,n){this.fn=h,this.context=e,this.once=n||!1}function r(){}r.prototype._events=void 0;r.prototype.listeners=function(e){if(!this._events||!this._events[e])return[];if(this._events[e].fn)return[this._events[e].fn];for(var n=0,o=this._events[e].length,s=new Array(o);n<o;n++)s[n]=this._events[e][n].fn;return s};r.prototype.emit=function(e,n,o,s,f,u){if(!this._events||!this._events[e])return!1;var t=this._events[e],c=arguments.length,l,i;if(typeof t.fn=="function"){switch(t.once&&this.removeListener(e,t.fn,!0),c){case 1:return t.fn.call(t.context),!0;case 2:return t.fn.call(t.context,n),!0;case 3:return t.fn.call(t.context,n,o),!0;case 4:return t.fn.call(t.context,n,o,s),!0;case 5:return t.fn.call(t.context,n,o,s,f),!0;case 6:return t.fn.call(t.context,n,o,s,f,u),!0}for(i=1,l=new Array(c-1);i<c;i++)l[i-1]=arguments[i];t.fn.apply(t.context,l)}else{var E=t.length,p;for(i=0;i<E;i++)switch(t[i].once&&this.removeListener(e,t[i].fn,!0),c){case 1:t[i].fn.call(t[i].context);break;case 2:t[i].fn.call(t[i].context,n);break;case 3:t[i].fn.call(t[i].context,n,o);break;default:if(!l)for(p=1,l=new Array(c-1);p<c;p++)l[p-1]=arguments[p];t[i].fn.apply(t[i].context,l)}}return!0};r.prototype.on=function(e,n,o){var s=new a(n,o||this);return this._events||(this._events={}),this._events[e]?this._events[e].fn?this._events[e]=[this._events[e],s]:this._events[e].push(s):this._events[e]=s,this};r.prototype.once=function(e,n,o){var s=new a(n,o||this,!0);return this._events||(this._events={}),this._events[e]?this._events[e].fn?this._events[e]=[this._events[e],s]:this._events[e].push(s):this._events[e]=s,this};r.prototype.removeListener=function(e,n,o){if(!this._events||!this._events[e])return this;var s=this._events[e],f=[];if(n&&(s.fn&&(s.fn!==n||o&&!s.once)&&f.push(s),!s.fn))for(var u=0,t=s.length;u<t;u++)(s[u].fn!==n||o&&!s[u].once)&&f.push(s[u]);return f.length?this._events[e]=f.length===1?f[0]:f:delete this._events[e],this};r.prototype.removeAllListeners=function(e){return this._events?(e?delete this._events[e]:this._events={},this):this};r.prototype.off=r.prototype.removeListener;r.prototype.addListener=r.prototype.on;r.prototype.setMaxListeners=function(){return this};r.EventEmitter=r;r.EventEmitter2=r;r.EventEmitter3=r;y.exports=r});var w=_((A,g)=>{"use strict";var d=m(),x=L(),v=x.getSingleton("hootbus");typeof v>"u"&&(v=new d,x.registerSingleton("hootbus",v));g.exports=v});export{m as a,w as b};
//# sourceMappingURL=chunk-INSRYSWJ.js.map