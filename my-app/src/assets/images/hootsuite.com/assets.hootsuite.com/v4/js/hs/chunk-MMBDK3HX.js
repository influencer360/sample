import{a as he,b as ye,c as ge,d as qe}from"./chunk-NFR2PUQG.js";import{a as se,b as ae,d as le,e as ce,f as pe,j as x,l as me,n as de,q as Xe,r as ue,s as Ve}from"./chunk-JSDZMTFG.js";import{a as fe,b as je}from"./chunk-F7M3AVM6.js";import{b as re,g as Ge}from"./chunk-C3ATEAKX.js";import{a as s,b as i,c as L}from"./chunk-MMUQV2H6.js";import{b as E,c as ze,d as Ke}from"./chunk-FW7QGJ5I.js";import{b as We}from"./chunk-PALMNRBQ.js";import{e as ne,h as r,i as T}from"./chunk-QYNB3KGD.js";import{a as g}from"./chunk-JMUJZFCQ.js";import{b as a,d as De,f}from"./chunk-62VJZGPO.js";var P,X,b,Ee=a(()=>{P=f(We()),X=class{constructor(){this.onKeyDown=n=>{let p=this.getLastElement(),l=this.getFocusableElements();if(l.length){let d=l[0],c=l[l.length-1];if(n.key==="Tab"){n.stopPropagation();let{activeElement:h}=document;n.shiftKey&&(h===d||h===p)?(n.preventDefault(),c.focus()):!n.shiftKey&&h===c&&(n.preventDefault(),d.focus())}}},this.elements=(0,P.List)(),this.nodesFocusedBeforeActivation=(0,P.List)();let t=["button:not([disabled])","[href]","input:not([disabled])","select:not([disabled])","textarea:not([disabled])",'[tabindex]:not([tabindex="-1"]):not([data-is-dropdown-item])'];this.focusableElementsSelector=t.join(",")}addElement(t){this.nodesFocusedBeforeActivation=this.nodesFocusedBeforeActivation.push(document.activeElement),this.elements=this.elements.push(t)}getElementIndex(t){return this.elements.findIndex(n=>n===t)}getElements(){return this.elements}getLastElement(){return this.elements.last()}getFocusableElements(){return this.getLastElement()?.querySelectorAll(this.focusableElementsSelector)}safeFocus(t){t&&t!==document.activeElement&&typeof t.focus=="function"&&t.focus()}focus(){let t=this.elements.last();this.safeFocus(t)}restoreFocus(t){let n=this.nodesFocusedBeforeActivation.get(t);this.nodesFocusedBeforeActivation=this.nodesFocusedBeforeActivation.slice(0,t),this.safeFocus(n)}trapFocus(){this.getLastElement().addEventListener("keydown",this.onKeyDown)}remove(t){if(t){let n=this.getElementIndex(t);n!==-1&&(this.elements.get(n).removeEventListener("keydown",this.onKeyDown),this.elements=this.elements.delete(n),this.restoreFocus(n))}this.elements.forEach(n=>{document.body&&!document.body.contains(n)&&(this.elements=this.elements.delete(this.getElementIndex(n)))})}reset(){this.elements=(0,P.List)(),this.nodesFocusedBeforeActivation=(0,P.List)()}},b=new X});var Ye,k,j=a(()=>{T();L();Ye="1120px",k=s(r.div`
  font-family: ${()=>i(e=>e.typography.fontFamily.primary)};
  display: flex;
  flex-direction: column;

  position: relative;
  max-width: ${Ye};
  max-height: 100%;

  border: 2px solid ${()=>i(e=>e.colors.primary)};
`)});var $,Ue,Ze,be,Te=a(()=>{$=f(g());Ee();T();j();Ue=r.div`
  outline: none;

  // Match styles of witha11y={false}
  position: fixed;
  display: flex;
  inset: 0;
  z-index: 2096;
  -webkit-box-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  align-items: center;
  padding: 80px;
`,Ze=e=>{let t=(0,$.useRef)(null),{children:n,ariaLabel:p,ariaLabelledBy:l,ariaDescribedBy:d,className:c="",onClick:h}=e,w=y=>{let{onEscapeKeyPress:H=()=>null}=e;(y.key==="Escape"||y.key==="Esc")&&H(y)},F=()=>{let{features:y={escapeExits:!0,focusManager:!0},initialFocusedSelector:H}=e;if(y.focusManager&&t.current)if(b.addElement(t.current),H){let B=t.current.querySelector(H);b.safeFocus(B),b.trapFocus()}else setTimeout(()=>{let B=b.getFocusableElements();B.length&&(b.safeFocus(B[0]),b.trapFocus())},0);y.escapeExits&&document.addEventListener("keydown",w)},o=()=>{let{features:y={escapeExits:!0,focusManager:!0}}=e;y.focusManager&&t.current&&b.remove(t.current),y.escapeExits&&document.removeEventListener("keydown",w)};(0,$.useEffect)(()=>(F(),()=>o()),[]);let m={tabIndex:-1,role:"dialog","aria-modal":!0,"aria-label":p,"aria-labelledby":l,"aria-describedby":d};return $.default.createElement(Ue,{ref:t,...m},$.default.createElement(k,{className:c,onClick:h},n))},be=Ze});var V,xe,$e=a(()=>{V=f(g());Te();j();xe=({className:e,children:t,withA11y:n=!1,...p})=>{if(n){let{onEscapeKeyPress:l=()=>null,features:d,ariaLabel:c,ariaLabelledBy:h,ariaDescribedBy:w,initialFocusedSelector:F}=p;return V.default.createElement(be,{onEscapeKeyPress:l,features:d,ariaLabel:c,ariaLabelledBy:h,ariaDescribedBy:w,initialFocusedSelector:F,className:e,onClick:o=>o.stopPropagation()},t)}else return V.default.createElement(k,{className:e,onClick:l=>l.stopPropagation()},t)}});var q,Je,Qe,O,et,tt,Ie=a(()=>{q=f(g());T();Ge();L();Je=s(r.div`
  background-color: ${()=>i(e=>e.colors.lightGrey10)};
  border: 1px solid ${()=>i(e=>e.colors.lightGrey10)};
`),Qe=s(r.div`
  display: flex;
  flex-direction: column;
  padding: 0 64px 0 ${()=>i(e=>e.spacing.spacing48)};
  max-width: 500px;
`),O=({children:e})=>q.default.createElement(Je,null,q.default.createElement(Qe,null,e)),et=s(r(re)`
    font-weight: ${()=>i(e=>e.typography.pageTitle.weight)};
    font-size: ${()=>i(e=>e.typography.pageTitle.size)};
    line-height: ${()=>i(e=>e.typography.pageTitle.lineHeight)};
    margin: ${()=>i(e=>e.spacing.spacing36)} 0
      ${()=>i(e=>e.spacing.spacing24)} 0;
  `),tt=s(r.div`
  margin-bottom: ${()=>i(e=>e.spacing.spacing36)};
  font-size: ${()=>i(e=>e.typography.body.size)};
`);O.Title=et;O.Description=tt});var S,A,ot,it,Y,nt,rt,st,at,lt,ct,Ce=a(()=>{S=f(g());T();me();L();A=480,ot=s(r.div`
  flex: 1 1 auto;
  background-color: ${()=>i(e=>e.colors.modal.footerBackground)};
  border-top: ${()=>i(e=>e.colors.primary)};
`),it=s(r.div`
  display: flex;
  flex-direction: row-reverse;
  padding: ${()=>i(e=>e.spacing.spacing16)};
  @media (max-width: ${A}px) {
    display: block;
  }
`),Y=({className:e="",children:t})=>S.default.createElement(ot,{className:e},S.default.createElement(it,null,t)),nt=r(x).attrs({type:le})`
  @media (max-width: ${A}px) {
    display: block;
    width: 100%;
  }
`,rt=r(x).attrs({type:se})`
  margin-right: ${()=>i(e=>e.spacing.spacing8)};
  @media (max-width: ${A}px) {
    display: block;
    width: 100%;
  }
`,st=r.div`
  flex: 1 1 auto;
  @media (max-width: ${A}px) {
    display: block;
    width: 100%;
  }
`,at=r(x).attrs({type:ae})`
  @media (max-width: ${A}px) {
    width: 100%;
  }
`,lt=e=>S.default.createElement(st,null,S.default.createElement(at,{...e})),ct=r(x).attrs({type:ce})`
  margin-right: ${()=>i(e=>e.spacing.spacing8)};
  @media (max-width: ${A}px) {
    display: block;
    width: 100%;
  }
`;Y.Buttons={PrimaryAction:nt,SecondaryAction:rt,TertiaryAction:lt,UpgradeAction:ct}});var pt,we,mt,dt,Fe,Le=a(()=>{T();L();pt="48px",we="48px",mt="0",dt="48px",Fe=s(r.div.attrs({tabIndex:0})`
    overflow-y: auto;
    box-sizing: border-box;
    padding: ${mt} ${we} ${pt} ${we};
    min-height: ${dt};
    background-color: ${()=>i(e=>e.colors.modal.background)};
  `)});var Ae,ve,R,Pe=a(()=>{Ae=f(g()),ve=f(Ke()),R=ve.default.bind(Ae.default.createElement)});var N,ft,U,Z,J,Se,Ne=a(()=>{N=f(g());Pe();ze();ft=()=>(Date.now()+~~(Math.random()*999999)).toString(36),U=e=>e.$$typeof&&e.$$typeof===Symbol.for("react.element"),Z=e=>Array.isArray(e)?e.filter(Boolean).map((t,n)=>U(t)?Z((0,N.cloneElement)(t,{key:t.key||t.props.key||n})):t):e&&U(e)?(0,N.cloneElement)(e,{children:N.Children.toArray(e.props.children).map(t=>U(t)?Z(t):t)}):e,J=({size:e,title:t,glyph:n,highlight:p,$theme:l,...d})=>{let c=null;return t!=null&&(c=ft()),R`
    <svg
      width=${e}
      height=${e}
      viewBox='0 0 20 20'
      aria-labelledby=${t?c:null}
      ...${d}
    >
      ${t&&R`<title id=${c}>${t}<//>`}
      ${Z(n({html:R,highlight:p}))}
    <//>
  `};J.propTypes={glyph:E.func.isRequired,size:E.oneOfType([E.string,E.number]),viewBox:E.string,highlight:E.string,title:E.string};J.defaultProps={fill:"#2f3638",size:16,highlight:""};Se=J});var _e,Me=a(()=>{_e=({html:e})=>e`
  <path
    d="M18.37,1.62 C17.87,1.12 17.12,1.12 16.62,1.62 L10,8.25 L3.37,1.62 C2.87,1.12 2.12,1.12 1.62,1.62 C1.12,2.12 1.12,2.87 1.62,3.37 L8.25,10 L1.62,16.62 C1.12,17.12 1.12,17.87 1.62,18.37 C1.87,18.62 2.12,18.75 2.5,18.75 C2.87,18.75 3.12,18.62 3.37,18.37 L10,11.75 L16.62,18.37 C16.87,18.62 17.25,18.75 17.5,18.75 C17.75,18.75 18.12,18.62 18.37,18.37 C18.87,17.87 18.87,17.12 18.37,16.62 L11.75,10 L18.37,3.37 C18.87,2.87 18.87,2.12 18.37,1.62 Z"
  />
`});var I,v,C,_,W,z,ut,ht,Q,u,He,D,ee,te=a(()=>{I="PLACEMENT_TOP",v="PLACEMENT_BOTTOM",C="PLACEMENT_LEFT",_="PLACEMENT_RIGHT",W="SHIFT_RIGHT",z="SHIFT_LEFT",ut={PLACEMENT_TOP:I,PLACEMENT_BOTTOM:v,PLACEMENT_LEFT:C,PLACEMENT_RIGHT:_},ht={SHIFT_RIGHT:W,SHIFT_LEFT:z},Q="",u={text:Q,enabled:!0,offset:0,placement:I,delay:"0s",zIndex:"auto",shift:Q,whiteSpace:"pre",minWidth:"auto",noWrapper:!1},He=(e,t)=>isNaN(parseInt(e,10))?t:parseInt(e,10),D=(e,t)=>typeof e=="string"?e:t,ee=(e={})=>{let t={};return e=typeof e=="object"?e||{}:{},t.text=D(e.text,u.text),t.enabled=typeof e.enabled>"u"?u.enabled:!!e.enabled,t.text===Q&&(t.enabled=!1),t.offset=He(e.offset,u.offset),t.placement=ut[e.placement]||u.placement,t.delay=D(e.delay,u.delay),t.zIndex=e.zIndex==="auto"?"auto":He(e.zIndex,u.zIndex),t.shift=ht[e.shift]||u.shift,t.whiteSpace=D(e.whiteSpace,u.whiteSpace),t.minWidth=D(e.minWidth,u.minWidth),t.noWrapper=e.noWrapper||u.noWrapper,t}});var M,G,oe,ke=a(()=>{L();T();M=f(g());te();G=6,oe=(e,t={})=>{let n=!window.ActiveXObject&&"ActiveXObject"in window,p=(o,m=!1)=>{if(o.placement===I)return`left: 50%; bottom: calc(100% + ${m?o.offset:o.offset+G}px);`;if(o.placement===v)return`left: 50%; top: calc(100% + ${m?o.offset:o.offset+G}px);`;if(o.placement===C)return` top: 50%; right: calc(100% + ${o.offset}px);`;if(o.placement===_)return` top: 50%; left: calc(100% + ${o.offset}px);`},l=(o,m=!1)=>{if(o.placement===I||o.placement===v)return"transform: translateX(-50%);";if(o.placement===C)return`transform: translateY(-50%) ${m?"":`translateX(-${G}px)`};`;if(o.placement===_)return`transform: translateY(-50%) ${m?"":`translateX(${G}px)`};`},d=o=>{if(o.placement===I||o.placement===v){if(o.shift===W)return"transform: translateX(-20%);";if(o.shift===z)return"transform: translateX(-80%);"}},c=ne`
    &:not(& &) {
      position: relative;

      &:before, &:after {
        z-index: ${o=>o.tooltipProps.zIndex};
        transition-property: opacity left right top bottom;
        transition-timing-function: ease-out;
        transition-delay: 0s;
        opacity: 0;
        position: absolute;
        pointer-events: none;
      }

      &:before {
        transition-duration: 250ms;
        ${o=>p(o.tooltipProps,!0)}

        ${o=>l(o.tooltipProps,!0)}
        content: '';

        visibility: ${o=>o.tooltipProps.enabled?"visible":"hidden"};
      }

      &:after {
        transition-duration: 250ms;
        ${o=>p(Object.assign({},o.tooltipProps,{offset:o.tooltipProps.offset-20}),!1)};
        ${o=>l(o.tooltipProps,!1)};
        ${o=>d(o.tooltipProps)};

        /* Following is required to support single and double quotes in tooltips */
        content: '${o=>o.tooltipProps.text.replace(/"/g,'\\"').replace(/'/g,`'"'"'`)}';

        color: ${()=>i(o=>o.colors.tooltip.text)};

        padding: 6px 28px;
        
        white-space: ${o=>o.tooltipProps.whiteSpace};

        font-size: ${()=>i(o=>o.typography.body.size)};
        font-weight: bold;
        background: ${()=>i(o=>o.colors.tooltip.background)};

        line-height: ${()=>i(o=>o.typography.body.lineHeight)};

        visibility: ${o=>o.tooltipProps.enabled?"visible":"hidden"};
        
        min-width: ${o=>o.tooltipProps.minWidth};
      }

      // https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible#selectively_showing_the_focus_indicator
      // to show tooltip on keyboard focus you must set noWrapper to true
      &:focus:not(:focus-visible) {
        &:before, &:after {
          opacity: 0;
        }
      }

      &:hover,
      &:focus-visible {
        &:before, &:after {
          transition-delay: ${o=>o.tooltipProps.delay};
          opacity: 1;
        }
        &:before {
          ${o=>p(o.tooltipProps,!0)};
        }
        &:after {
          ${o=>p(o.tooltipProps,!1)};
        }
      }
    }
  `,h=s(r.div`
      padding: 0;
      margin: 0;

      ${c}
    `),w=s(r(e)`
      ${c}
    `),F=o=>{let m=typeof t=="function"?ee(t(o)):ee(t);return n?M.default.createElement(e,{title:m.text,...o}):m.noWrapper?M.default.createElement(w,{...o,tooltipProps:m}):M.default.createElement(h,{tooltipProps:m},M.default.createElement(e,{...o}))};return F.displayName=`withTooltip (${e.displayName})`,F}});var Oe=a(()=>{ke();te()});var K,yt,ie,gt,Et,bt,Tt,Re=a(()=>{K=f(g());T();Ne();Me();me();Xe();L();je();Oe();Ve();qe();yt=s(r.div`
  position: absolute;
  top: ${()=>i(e=>e.spacing.spacing16)};
  right: ${()=>i(e=>e.spacing.spacing16)};
`),ie=({children:e})=>K.default.createElement(yt,null,e),gt=r(x).attrs(e=>({type:pe,"aria-label":e.$i18n.closeLabel()}))``,Et=fe(de({closeLabel:"Close"}),e=>oe(e,({$i18n:t})=>({text:t.closeLabel(),placement:C})),e=>ue(e,"DialogCloseButton"))(gt),bt=s(r(Se)`
  fill: ${()=>i(e=>e.colors.primary)};
  size: ${()=>i(e=>e.spacing.spacing44)};
`),Tt=({close:e,keyDown:t})=>K.default.createElement(Et,{onClick:e,onKeyDown:ge({[he]:t,[ye]:t})},K.default.createElement(bt,{glyph:_e}));ie.Close=Tt});var xt={};De(xt,{Content:()=>Fe,Dialog:()=>xe,Footer:()=>Y,Header:()=>O,Icons:()=>ie});var $t=a(()=>{$e();Ie();Ce();Le();Re()});export{xe as a,O as b,Y as c,Fe as d,ie as e,xt as f,$t as g};
//# sourceMappingURL=chunk-MMBDK3HX.js.map
