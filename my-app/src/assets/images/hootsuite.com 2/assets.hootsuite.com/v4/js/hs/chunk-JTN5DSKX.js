import{a as I}from"./chunk-NWKOIDHD.js";import{b as c,f as y}from"./chunk-62VJZGPO.js";var _,p,u=c(()=>{_=new Set(["@@redux/INIT","@@INIT"]),p=e=>_.has(e)});var a,l=c(()=>{a=(e=[],r)=>{try{if(r==null||!e.length)return r;let[n,...t]=e;return a(t,r[n])}catch{return}}});var T,E=c(()=>{l();T=(e,r)=>{if(e==null)throw new Error(`

Missing Event Type`);let n=e.split(/[/]/),t=a(n,r);if(t==null)throw new Error(`

Invalid handler: ${e}`);return t}});var f,m=c(()=>{f=(e,r,n)=>{}});var g,v=c(()=>{u();E();m();g=(e,r)=>(n={},t={})=>{let{type:s,payload:o=[]}=t;var i=n;try{if(p(s))return n;i=T(s,r).call(null,n,...o)}catch(d){f(e,d,t)}return i}});var x,h,C,w=c(()=>{x=y(I());v();h=typeof window<"u"?window.__REDUX_DEVTOOLS_EXTENSION__:()=>{},C=(e,r,n)=>{let t=g(e,r),s=h&&h({name:e}),o=(0,x.createStore)(t,n,s);return{store:o,getState:o.getState.bind(o),subscribe:o.subscribe.bind(o),dispatch:(i,...d)=>o.dispatch({type:i,payload:d})}}});export{C as a,w as b};
//# sourceMappingURL=chunk-JTN5DSKX.js.map
