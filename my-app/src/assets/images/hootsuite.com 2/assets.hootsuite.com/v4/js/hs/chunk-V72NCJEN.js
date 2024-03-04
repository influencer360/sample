import{a as o,b as r,c as f}from"./chunk-MMUQV2H6.js";import{e as i,f as l,h as n,i as g}from"./chunk-QYNB3KGD.js";import{a as p}from"./chunk-JMUJZFCQ.js";import{b as a,d,f as h}from"./chunk-62VJZGPO.js";var t,u,$,y,v,s,c=a(()=>{t=h(p());g();f();u=l`
  30% {
    transform: scale(1);
    opacity: .60;
  }
  50% {
    transform: scale(.8);
  }
  70% {
    transform: scale(1.2);
    opacity: 1;
  }
  90% {
    transform: scale(1);
    opacity: .60;
  }
`,$=i`1s ${u} infinite`,y=o(n.div`
  display: inline-block;
  width: ${e=>e.size}px;
  height: ${e=>Math.ceil(e.size*.75)}px;
  line-height: 0;

  position: ${e=>e.hAlign||e.vAlign?"absolute":null};
  left: ${e=>e.hAlign?"50%":null};
  top: ${e=>e.vAlign?"50%":null};
  transform: ${e=>e.hAlign&&"translateX(-50%)"}
    ${e=>e.vAlign&&"translateY(-50%)"};

  > div {
    background-color: ${e=>e.fill||r(m=>m.colors.darkGrey)};
    display: inline-block;
    width: ${e=>Math.floor(e.size/4)}px;
    height: 100%;
    vertical-align: middle;
    opacity: 0.6;
    border-radius: ${e=>Math.floor(e.size/12)}px;

    animation: ${$};

    &:nth-child(2) {
      margin: 0 ${e=>Math.ceil(e.size/4/2)}px;
      animation-delay: 100ms;
    }
    &:nth-child(3) {
      animation-delay: 200ms;
    }
  }
`),v={size:26,hAlign:!0,vAlign:!0},s=e=>t.createElement(y,{...v,...e,alt:"","data-testid":"bouncing-bars-loader-wrapper"},t.createElement("div",{alt:""}),t.createElement("div",{alt:""}),t.createElement("div",{alt:""}))});var A={};d(A,{BouncingBars:()=>s});var b=a(()=>{c()});export{s as a,A as b,b as c};
//# sourceMappingURL=chunk-V72NCJEN.js.map
