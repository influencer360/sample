import{a as ko}from"./chunk-XVF4SJQS.js";import{a as kt,b as Wo,c as Ai}from"./chunk-K3V6P2YE.js";import{a as xi}from"./chunk-QSIKJSHR.js";import{c as vo}from"./chunk-F5CWFDHA.js";import{a as Ne,d as So,e as q,g as tt,i as Dt}from"./chunk-QG2RGRKZ.js";import{a as Ro}from"./chunk-ETGVIKWH.js";import{b as Mo}from"./chunk-OZL6K2YT.js";import{a as Y,b as be}from"./chunk-BWBYXULB.js";import{a as H,b as E,c as O,d as Q,e as b,g as me}from"./chunk-MMBDK3HX.js";import{e as Po,j as zo,l as Ii,n as I,q as P,r as Uo,s as Ci,u as Fo,x as Ho,z as wi}from"./chunk-JSDZMTFG.js";import{a as No,b as bo,i as gi}from"./chunk-UBVFLRJI.js";import{a as ot,b as Lo,d as V,e as re,g as pe}from"./chunk-C3ATEAKX.js";import{a as w,b as u,c as ve}from"./chunk-MMUQV2H6.js";import{f as z,h as rt}from"./chunk-BUPZWSPL.js";import{a as Ti}from"./chunk-EAS5SCWN.js";import{a as Je,b as i,c as T,d as Bo}from"./chunk-FW7QGJ5I.js";import{c as et,d as Oo}from"./chunk-PALMNRBQ.js";import{e as Xe,f as _o,h as c,i as _}from"./chunk-QYNB3KGD.js";import{a as jo}from"./chunk-GPJJZIA4.js";import{a as g}from"./chunk-HWDIAN4C.js";import{b as f,c as de}from"./chunk-BRMHBYYL.js";import{b as fi}from"./chunk-RRWPNPQ4.js";import{b as oe}from"./chunk-527EYBTV.js";import{a as p}from"./chunk-JMUJZFCQ.js";import{b as ue,d as Do}from"./chunk-BLZ2UTLS.js";import{e as Ze,f as Eo,g as v,h as Me}from"./chunk-WBPTDCVX.js";import{c as yo}from"./chunk-SHTS4IQB.js";import{a as Qe}from"./chunk-JRESDEDW.js";import{b as N}from"./chunk-INSRYSWJ.js";import{b as d,c as k}from"./chunk-RBJWJTV5.js";import{a as C}from"./chunk-5M6X2SDJ.js";import{f as a}from"./chunk-62VJZGPO.js";var hi=a(C());var K=a(C());de();var x=a(N());k();gi();var Go=a(C()),ne=a(N());Do();k();var yi="TIKTOK";function Ei(e,t){let o=Number(hs.organizations&&hs.organizations.length);e=="INSTAGRAM"?ne.default.emit("socialNetwork:addNetwork:instagramType",t):e=="TIKTOKBUSINESS"&&So()?Di(t,o):ne.default.emit("socialNetwork:authorize:command",e,t)}function Di(e,t){vo(hs.memberId,yi).then(function(o){o&&o.permission&&o.permission.value<1&&t===0?ne.default.emit("socialNetwork:showPaywall:tiktokbusiness",e):ne.default.emit("socialNetwork:authorize:command","TIKTOKBUSINESS",e)}).catch(o=>{hs.isFeatureEnabled("CI_2548_ENTITLEMENT_CHECK_METRICS")&&(bo(`Entitlements check failed at checkTikTokBusinessEntitlement: ${o}`),No(o)),Ro.displayError({message:d._("Sorry, we couldn't connect your TikTok account.")})})}function $o(e,t){let o=document.createElement("div");o.id="add_social_account_modal_container",document.body.appendChild(o);let r=function(){ue("hs-app-auth-modals").then(function(m){m.unmount(o)}),o.parentNode.removeChild(o),ne.default.emit("modal:close")};var n=Go.default.pick(t,["showPrivateNetworkDestination","socialNetworks","selectedDestination"]);n.onDismiss=function(){r()},n.addAccount=Ei;var s=e.organizations?Object.values(e.organizations):[],l=e.teams?Object.values(e.teams):[];return n.dashboardOrganizationsAndTeams=s.concat(l),t.organizationId&&!t.selectedDestination&&(n.selectedDestination={organizationId:t.organizationId}),t.hidePicker&&(n.hideDestinationPicker=t.hidePicker),ue("hs-app-auth-modals").then(function(m){m.mountAddSocialAccountModal(o,n),ne.default.emit("modal:open")}),{close:r}}var Dr=a(p()),Bt=a(oe()),ct=a(N());Me();T();var zt=a(p());tt();T();var h=a(p());be();me();pe();P();rt();_();var ki="https://i.hootsuite.com",Yo=`${ki}/assets/channel-integrations/fb_login_screenshot.png`,Mt="web.auth.instagram.business.process",Vo="https://help.hootsuite.com/hc/en-us/articles/1260804308169-Connect-an-Instagram-account-to-a-Facebook-Page",Ko="https://help.hootsuite.com/hc/articles/1260802308530",qo="https://help.hootsuite.com/hc/articles/1260802308510",Mi="data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAgMjAiIGFyaWEtbGFiZWw9Ikhvb3RzdWl0ZSIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj4KICAgIDxwYXRoCiAgICAgICAgZD0iTTE5LjczNDUgMi43Njg1OEwxMy4yODAxIDMuMzQ2MTRDMTIuMTY2NyAyLjY5NzEzIDExLjA1OTIgMi40NDExIDkuODg2MjMgMi40NDExQzkuNTc2NjEgMi40NDExIDkuMjYxMDQgMi40NzA4NyA4Ljk0NTQ3IDIuNTI0NDZMMi4yMTcyMyAwLjAxNzc0NTJDMS45NDkzIC0wLjA4MzQ3NiAxLjc1MjgxIDAuMjczNzc1IDEuOTc5MDcgMC40NDY0NDdMNi4xMjMxOCAzLjY0OThDNS4yNDc5MiA0LjE5NzU5IDQuNDI2MjQgNC45MDAxOCAzLjcxMTc0IDUuNzE1OUMyLjQ2NzMxIDcuMTMzIDAuOTE5MjIxIDExLjAzMyAwLjE2MzAzOSAxMy4wNjkzQy0wLjE1ODQ4NyAxMy45Mzg2IDAuMDAyMjc2MTcgMTQuOTA5MiAwLjU4NTc4NyAxNS42MjM3QzEuOTU1MjUgMTcuMjkwOCA0LjgwNzMxIDIwIDEwLjI4NTIgMjBDMTUuMzEwNSAyMCAxNy44NDcgMTcuNzQ5MyAxOS4wMzc4IDE2LjA5NDFDMTkuNjk4NyAxNS4xNzcxIDE5Ljg4OTMgMTQuMDEwMSAxOS41Njc3IDEyLjkyNjRDMTkuMDIgMTEuMDk4NSAxNy44ODI3IDcuOTMwODYgMTYuMDMxIDUuNzU3NThDMTUuOTY1NSA1LjY4MDE4IDE1LjkgNS42MDI3NyAxNS44MzQ1IDUuNTMxMzJMMTkuODUzNSAzLjE0OTY1QzIwLjA1IDMuMDQyNDcgMTkuOTYwNyAyLjc1MDcyIDE5LjczNDUgMi43Njg1OFoiCiAgICAgICAgZmlsbD0iI0ZGNEM0NiIKICAgID48L3BhdGg+CiAgICA8cGF0aAogICAgICAgIGQ9Ik0xMy4wMTIyIDE0LjUzNDFDMTIuNTI5OSAxNC43MDY3IDExLjQ0NjIgMTQuOTYyOCAxMC4yNDk0IDE0LjM0MzVDMTAuMTg5OSAxNC4zMTM4IDEwLjEzMDQgMTQuMzkxMiAxMC4xNzggMTQuNDM4OEMxMC41NTkxIDE0Ljg0OTYgMTEuMjM3OCAxNS41NjQxIDExLjY0ODcgMTUuOTE1NEMxMS43MzIgMTUuOTg2OSAxMS44NjMgMTUuOTgwOSAxMS45NDA0IDE1Ljg5NzZMMTMuMDgzNiAxNC42MzUzQzEzLjEyNTMgMTQuNTg3NiAxMy4wNzE3IDE0LjUxMDIgMTMuMDEyMiAxNC41MzQxWiIKICAgICAgICBmaWxsPSJ3aGl0ZSIKICAgID48L3BhdGg+CiAgICA8cGF0aAogICAgICAgIGQ9Ik0xNy40NjU5IDkuMjgyNDZDMTYuODUyNiA3Ljk2MDYzIDE1Ljk0MTYgNi43MjIxNiAxNC41NjAzIDYuNTYxNEMxNC4zMTAyIDYuNTMxNjMgMTQuMDYwMSA2LjU5MTE3IDEzLjgzOTggNi43MTYyMUwxMi4zMzM0IDcuNjA5MzRDMTEuOTU4MyA3LjgyOTY0IDExLjQ4MiA3Ljc5OTg3IDExLjE0MjYgNy41MzE5M0w5LjgzMjY0IDYuNTE5NzJDOS4zOTIwMyA2LjE4MDMzIDguODkxODggNS45MzAyNSA4LjM1MDA1IDUuODA1MjJDNi4wOTkzNyA1LjI3NTI5IDQuNTc1MDkgNi40NTQyMiAzLjQyNTkzIDguNjY5MThDMi4zMjQ0MSAxMC43ODI5IDIuOTM3NjkgMTMuODE5NiA1LjY1MjggMTQuNTQ2QzguNTE2NzcgMTUuMzA4MSAxMC40MTAyIDEyLjEyODYgMTEuMTY2NCAxMS4wNjg3QzExLjMwOTMgMTAuODY2MyAxMS42MTI5IDEwLjg2NjMgMTEuNzYxOCAxMS4wNjg3QzEyLjkzNDggMTIuNjY0NCAxNC41MTg2IDE0LjM3MzMgMTYuMjA5NiAxNC4wMzM5QzE4LjQxODYgMTMuNTgxNCAxOC4xNTY2IDEwLjc3NyAxNy40NjU5IDkuMjgyNDZaTTkuMTc3NjggMTAuOTY3NUM4LjYyOTg5IDExLjMzNjcgNy45MjEzNSAxMS4yNTMzIDcuNTA0NTUgMTAuNjI4MUM3LjA4MTgxIDEwLjAwMjkgNy4yNzIzNCA5LjMxODE5IDcuODIwMTIgOC45NDkwM0M4LjM2NzkxIDguNTc5ODcgOS4wNzY0NiA4LjY2MzIzIDkuNDkzMjUgOS4yODg0MkM5LjkxNiA5LjkxMzYxIDkuNzMxNDIgMTAuNTk4MyA5LjE3NzY4IDEwLjk2NzVaTTE1LjAzNjYgMTEuMDc0N0MxNC40ODg4IDExLjQ0MzggMTMuNzgwMyAxMS4zNjA1IDEzLjM2MzUgMTAuNzM1M0MxMi45NDA3IDEwLjExMDEgMTMuMTMxMyA5LjQyNTM2IDEzLjY3OSA5LjA1NjJDMTQuMjI2OCA4LjY4NzA0IDE0LjkzNTQgOC43NzA0IDE1LjM1MjIgOS4zOTU1OUMxNS43NzQ5IDEwLjAyMDggMTUuNTg0NCAxMC43MDU1IDE1LjAzNjYgMTEuMDc0N1oiCiAgICAgICAgZmlsbD0id2hpdGUiCiAgICA+PC9wYXRoPgogICAgPHBhdGgKICAgICAgICBkPSJNMTEuNzE0MiAxMS44OTA0QzExLjYwMSAxMS43NTk0IDExLjM5ODYgMTEuNzY1NCAxMS4yODU1IDExLjg5NjRMMTAuMDgyNyAxMy4zMjU0QzEwLjAyOTEgMTMuMzkwOSAxMC4wNDEgMTMuNDkyMSAxMC4xMDY1IDEzLjU0NTdDMTAuMzgwNCAxMy43NDIxIDExLjA2NTIgMTQuMTc2OCAxMS43MjYxIDE0LjE3NjhDMTIuMzM5NCAxNC4xNzY4IDEyLjg5MzEgMTMuOTM4NiAxMy4xNjEgMTMuODAxN0MxMy4yNTAzIDEzLjc2IDEzLjI2ODIgMTMuNjQwOSAxMy4yMDI3IDEzLjU2OTVMMTEuNzE0MiAxMS44OTA0WiIKICAgICAgICBmaWxsPSJ3aGl0ZSIKICAgID48L3BhdGg+Cjwvc3ZnPg==",Qo=Xe`
  background: no-repeat url(${Mi});
  background-position: center;
  background-size: 100%;
`;_();pe();ve();me();var Re=a(p());var Zo=a(p()),Jo=a(Bo()),nt=Jo.default.bind(Zo.default.createElement);T();var Ni=()=>(Date.now()+~~(Math.random()*999999)).toString(36),Nt=e=>e.$$typeof&&e.$$typeof===Symbol.for("react.element"),bt=e=>Array.isArray(e)?e.filter(Boolean).map((t,o)=>Nt(t)?bt((0,Re.cloneElement)(t,{key:t.key||t.props.key||o})):t):e&&Nt(e)?(0,Re.cloneElement)(e,{children:Re.Children.toArray(e.props.children).map(t=>Nt(t)?bt(t):t)}):e,vt=({size:e,title:t,glyph:o,highlight:r,$theme:n,...s})=>{let l=null;return t!=null&&(l=Ni()),nt`
    <svg
      width=${e}
      height=${e}
      viewBox='0 0 20 20'
      aria-labelledby=${t?l:null}
      ...${s}
    >
      ${t&&nt`<title id=${l}>${t}<//>`}
      ${bt(o({html:nt,highlight:r}))}
    <//>
  `};vt.propTypes={glyph:i.func.isRequired,size:i.oneOfType([i.string,i.number]),viewBox:i.string,highlight:i.string,title:i.string};vt.defaultProps={fill:"#2f3638",size:16,highlight:""};var Se=vt;var Rt="#012b3a",Xo=c.div`
  && div > button {
    background-color: #ccd5d6 !important;
    &:focus,
    &:hover,
    &:active,
    &:hover:not([disabled]):not(:active) {
      background-color: #ccd5d6 !important;
      filter: brightness(110%) !important;
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px #00a68a !important;
    }
  }
`,er=c.div`
  && > button {
    background-color: ${Rt} !important;
    color: #ffffff !important;
    &:hover {
      background-color: #004963 !important;
    }
    &:focus {
      background-color: #004963 !important;
    }
    &:active {
      background-color: #001821 !important;
    }
    &:disabled {
      background-color: rgba(0, 73, 99, 0.1) !important;
      color: #879596 !important;
    }
    &:focus-visible {
      background-color: #004963 !important;
      box-shadow: 0 0 0 3px #00a68a !important;
    }
  }
`,tr=w(c.div`
  flex-shrink: 0;
  width: ${()=>u(e=>e.spacing.spacing60)};
  height: ${()=>u(e=>e.spacing.spacing60)};
  border-radius: 50%;
  background: ${Rt};
  &&:after {
    content: '';
    display: inline-block;
    vertical-align: middle;
    width: ${()=>u(e=>e.spacing.spacing36)};
    height: ${()=>u(e=>e.spacing.spacing36)};
    margin: ${()=>u(e=>e.spacing.spacing12)};
    ${Qo}
  }
`),or=c(Se)`
  margin-left: -5px;
`,rr=w(c.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding-top: ${()=>u(e=>e.spacing.spacing12)};
`),St=w(c.div`
  border-bottom: 1px solid ${Rt};
  width: 84px;
  height: 0;
  margin: 30px -${()=>u(e=>e.spacing.spacing20)};
`),it=w(c.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  min-width: 124px;
  max-width: 170px;
  align-items: center;
  &:first-child {
    margin-right: -${()=>u(e=>e.spacing.spacing4)};
  }
  &:last-child {
    margin-left: -${()=>u(e=>e.spacing.spacing4)};
  }
`),st=w(c(V)`
  margin-top: ${()=>u(e=>e.spacing.spacing32)};
  text-align: center;
`),nr=c(H)`
  width: 600px;
`,ir=c(H)`
  width: 724px;
`,sr=c(E.Description)`
  @media (max-height: 700px) {
    display: none;
  }
`,he=c(Q)`
  flex-direction: column;
  padding: 0 46px 32px 46px;
`,ar=c.div`
  background-color: ${()=>u(e=>e.colors.lightGrey10)};
  display: flex;
  flex-direction: column;
  padding: 0 48px;
  max-width: 628px;
`,cr=c.div`
  font-weight: ${()=>u(e=>e.typography.pageTitle.weight)};
  font-size: ${()=>u(e=>e.typography.pageTitle.size)};
  line-height: ${()=>u(e=>e.typography.pageTitle.lineHeight)};
  margin: 40px 0 16px 0;
`,_t=w(c.div`
  margin-bottom: 20px;
`),Ot=c(Lo)`
  margin-bottom: 6px;
`,lr=w(c(V)`
  font-size: ${()=>u(e=>e.typography.body.size)};
  margin-bottom: 20px;
  padding-left: 20px;
`),ur=c.div`
  position: relative;
  display: grid;
  grid-template-columns: auto auto;
  grid-gap: 18px 22px;
  padding-top: 15px;
  padding-right: 60px;
  padding-left: 10px;
`,fe=c(Se)`
  flex-shrink: 0;
`,Lt=c.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;Lt.displayName="IconWrapper";var dr=w(c.div`
  height: 100%;
  min-height: 60px;
  flex-shrink: 1;
  margin-top: 18px;
  border-right: 5px solid ${()=>u(e=>e.colors.lightGrey60)};
`),at=c.div`
  display: flex;
  justify-content: center;
`,pr=c.div`
  display: flex;
  justify-content: center;
  margin: 16px 0 16px 0;
`,mr=c(Se)`
  box-sizing: border-box;
  border: 2px solid white;
  border-radius: 50%;
  margin-right: -12px;
  z-index: 1;
`,hr=c(Se)`
  box-sizing: border-box;
  border: 2px solid white;
  border-radius: 50%;
`,fr=c.div`
  background-color: ${()=>u(e=>e.colors.primary10)};
  padding: 24px;
`,gr=c.div`
  font-size: ${()=>u(e=>e.typography.subSectionTitle.size)};
  font-weight: ${()=>u(e=>e.typography.subSectionTitle.weight)};
  margin-bottom: 18px;
`,Ir=c.div`
  font-size: ${()=>u(e=>e.typography.body.size)};
  margin-bottom: 18px;
`;var B=a(p());var ge=({html:e})=>e`
<g>
  <path
    fill="#1877F2"
    d="M20,10c0-5.523-4.477-10-10-10S0,4.477,0,10c0,4.991,3.657,9.128,8.438,9.878v-6.988H5.898V10h2.539V7.797 c0-2.506,1.493-3.891,3.777-3.891c1.094,0,2.238,0.195,2.238,0.195v2.461h-1.261c-1.242,0-1.63,0.771-1.63,1.562V10h2.773 l-0.443,2.891h-2.33v6.988C16.343,19.128,20,14.991,20,10z"
  />
  <path
    fill="#FFFFFF"
    d="M13.893,12.891L14.336,10h-2.773V8.124c0-0.791,0.387-1.562,1.63-1.562h1.261V4.102 c0,0-1.144-0.195-2.238-0.195c-2.284,0-3.777,1.384-3.777,3.891V10H5.898v2.891h2.539v6.988C8.947,19.958,9.468,20,10,20 s1.053-0.042,1.562-0.122v-6.988H13.893z"
  />
</g>
`;var Ie=({html:e})=>e`
  <g>
    <path
      d="M20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10Z"
      fill="#D93175"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.9613 12.4753C15.9884 12.0174 16 11.1926 16 9.99806C16 8.80736 15.9884 7.98257 15.9613 7.52469C15.909 6.4395 15.5837 5.60019 14.9894 5.00678C14.3959 4.41336 13.5595 4.091 12.4753 4.03872C12.0174 4.01162 11.1926 4 9.99806 4C8.80736 4 7.98257 4.01162 7.52469 4.03872C6.4395 4.091 5.60019 4.41336 5.00678 5.00678C4.41336 5.60019 4.091 6.44046 4.03872 7.52469C4.01162 7.98257 4 8.80736 4 9.99806C4 11.1926 4.01162 12.0174 4.03872 12.4753C4.091 13.5605 4.41336 14.3959 5.00678 14.9894C5.60019 15.5837 6.44046 15.909 7.52469 15.9613C7.98257 15.9884 8.80736 16 9.99806 16C11.1926 16 12.0174 15.9884 12.4753 15.9613C13.5605 15.909 14.3959 15.5837 14.9894 14.9894C15.5837 14.3959 15.909 13.5595 15.9613 12.4753ZM9.99806 5.07841C9.96418 5.07841 9.76379 5.07841 9.40077 5.07454C9.12586 5.07066 8.85091 5.07066 8.57599 5.07454C8.32521 5.08041 8.07448 5.08816 7.82381 5.09777C7.55387 5.10622 7.28479 5.13274 7.01839 5.17715C6.79864 5.21491 6.61375 5.26428 6.46273 5.32043C5.94225 5.52969 5.52969 5.94225 5.32043 6.46273C5.26331 6.61375 5.21394 6.79864 5.17715 7.01839C5.13553 7.24105 5.11229 7.51016 5.09777 7.82381C5.08816 8.07448 5.08041 8.32521 5.07454 8.57599C5.07067 8.76573 5.07067 9.04066 5.07454 9.40077C5.07841 9.76379 5.07841 9.96418 5.07841 9.99806C5.07841 10.0368 5.07841 10.2362 5.07454 10.5954C5.07067 10.9584 5.07067 11.2343 5.07454 11.4201C5.07841 11.6089 5.08616 11.8587 5.09777 12.1762C5.11229 12.4898 5.13553 12.759 5.17715 12.9816C5.21491 13.2014 5.26428 13.3863 5.32043 13.5373C5.52969 14.0577 5.94225 14.4703 6.46273 14.6796C6.61375 14.7367 6.79864 14.7861 7.01839 14.8228C7.24105 14.8616 7.51016 14.8877 7.82381 14.9022C8.13746 14.9138 8.39109 14.9216 8.57599 14.9255C8.76573 14.9293 9.04066 14.9293 9.40077 14.9255C9.76379 14.9216 9.96418 14.9216 9.99806 14.9216C10.0368 14.9216 10.2362 14.9216 10.5954 14.9255C10.9584 14.9293 11.2343 14.9293 11.4201 14.9255C11.6089 14.9216 11.8587 14.9138 12.1762 14.9022C12.4898 14.8877 12.759 14.8606 12.9816 14.8228C13.2014 14.7851 13.3863 14.7357 13.5373 14.6796C14.0577 14.4703 14.4703 14.0577 14.6796 13.5373C14.7367 13.3863 14.7861 13.2014 14.8228 12.9816C14.8616 12.759 14.8877 12.4898 14.9022 12.1762C14.9138 11.8587 14.9216 11.6089 14.9255 11.4201C14.9293 11.2343 14.9293 10.9584 14.9255 10.5954C14.9216 10.2373 14.9216 10.0359 14.9216 9.99809V9.99806V9.99804C14.9216 9.96408 14.9216 9.76371 14.9255 9.40077C14.9294 9.12586 14.9294 8.85091 14.9255 8.57599C14.9196 8.32521 14.9118 8.07448 14.9022 7.82381C14.8916 7.55402 14.8651 7.28508 14.8228 7.01839C14.7924 6.82914 14.7444 6.64312 14.6796 6.46273C14.4703 5.94225 14.0577 5.52969 13.5373 5.32043C13.3569 5.25557 13.1709 5.20761 12.9816 5.17715C12.7152 5.13307 12.4461 5.10655 12.1762 5.09777C11.8587 5.08616 11.6089 5.07841 11.4201 5.07454C11.1452 5.07065 10.8703 5.07065 10.5954 5.07454C10.2372 5.07841 10.0358 5.07841 9.99806 5.07841ZM13.7115 7.30591C13.8479 7.17126 13.9228 6.98639 13.9187 6.79477H13.9197C13.9197 6.59826 13.8519 6.42885 13.7115 6.28848C13.5779 6.15056 13.3934 6.07386 13.2014 6.07648C13.0106 6.07458 12.8275 6.15125 12.6951 6.28848C12.5547 6.42885 12.4821 6.59826 12.4821 6.79477C12.4795 6.98677 12.5562 7.17134 12.6941 7.30494C12.8266 7.44277 13.0102 7.51982 13.2014 7.51791C13.3934 7.52053 13.5779 7.44383 13.7115 7.30591ZM13.0765 9.99806C13.0765 10.8529 12.7773 11.5789 12.1801 12.1801C11.607 12.7663 10.8177 13.0906 9.99806 13.0765C9.17955 13.0904 8.39153 12.7661 7.81994 12.1801C7.23369 11.607 6.90944 10.8177 6.92352 9.99806C6.92352 9.14714 7.22265 8.41723 7.81994 7.81994C8.39153 7.2339 9.17955 6.90959 9.99806 6.92352C10.8529 6.92352 11.5789 7.22265 12.1801 7.81994C12.7661 8.39153 13.0904 9.17955 13.0765 9.99806ZM11.9981 9.99806C12.0078 9.46686 11.7956 8.95565 11.4124 8.58761C11.043 8.20458 10.531 7.99241 9.99903 8.00194C9.44627 8.00194 8.97677 8.19458 8.58761 8.58761C8.20444 8.95565 7.99216 9.46686 8.00194 9.99806C8.00194 10.5499 8.19458 11.0232 8.58761 11.4124C8.95565 11.7956 9.46686 12.0078 9.99806 11.9981C10.5304 12.0077 11.0427 11.7956 11.4124 11.4124C11.8054 11.0232 11.9981 10.5508 11.9981 9.99903V9.99806Z"
      fill="white"
    />
  </g>
`;P();var bi=({$i18n:e})=>B.default.createElement(he,null,B.default.createElement(ur,null,B.default.createElement(Lt,null,B.default.createElement(fe,{glyph:ge,size:40}),B.default.createElement(dr,null)),B.default.createElement(_t,null,B.default.createElement(Ot,null,"1. ",e.ListItem1()),B.default.createElement(lr,null,e.ListItem1DescriptionPart1())),B.default.createElement(fe,{glyph:Ie,size:40}),B.default.createElement(_t,null,B.default.createElement(Ot,null,"2. ",e.ListItem2())))),Cr=I({ListItem1:"Log in with Facebook",ListItem1DescriptionPart1:"We'll find the Instagram Business profiles that are connected to your Facebook Pages.",ListItem2:"Select the Instagram Business profiles to add to Hootsuite"})(bi);var y=a(p());var wr=({html:e})=>e`
  <g>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z"
      fill="#1877F2"
    />
    <path
      d="M5 6.4V5.5H15L13.75 8.5L15 11.5H5V10.6H6.875V6.4H5Z"
      fill="white"
    />
    <path
      d="M6.25 7H5.625V10H6.25V7Z"
      fill="white"
    />
    <path
      d="M6.25 12.1H5.625V16H6.25V12.1Z"
      fill="white"
    />
    <path
      d="M6.25 4.9H5.625V4H6.25V4.9Z"
      fill="white"
    />
  </g>
`;P();var vi=({$i18n:e})=>{let t=y.default.createElement(it,null,y.default.createElement(fe,{glyph:ge,size:60,"aria-hidden":"true"}),y.default.createElement(st,null,e.LogInToFacebook())),o=y.default.createElement(it,null,y.default.createElement(at,null,y.default.createElement(fe,{glyph:Ie,size:60,"aria-hidden":"true"}),y.default.createElement(or,{glyph:wr,size:60,"aria-hidden":"true"})),y.default.createElement(st,null,e.SelectIGBProfileDescription())),r=y.default.createElement(it,null,y.default.createElement(tr,{"aria-hidden":"true"}),y.default.createElement(st,null,e.AddToHootsuite()));return y.default.createElement(y.default.Fragment,null,y.default.createElement(he,null,y.default.createElement(rr,null,t,y.default.createElement(St,null),o,y.default.createElement(St,null),r)))},Tr=I({LogInToFacebook:"Log in to Facebook",SelectIGBProfileDescription:"Select a Business profile that's connected to a Facebook Page",AddToHootsuite:"Add to Hootsuite"})(vi);var W=a(p());pe();P();var Ri=({$i18n:e,onHelpLinkClick:t})=>W.default.createElement(he,null,W.default.createElement(at,null,W.default.createElement(mr,{glyph:Ie,size:"44px","aria-hidden":"true"}),W.default.createElement(hr,{glyph:ge,size:"44px","aria-hidden":"true"})),W.default.createElement(pr,null,W.default.createElement("img",{src:Yo,alt:"",width:"426",height:"265"})),W.default.createElement(fr,null,W.default.createElement(gr,null,e.InfoHeader()),W.default.createElement(Ir,{id:"igb-auth-process-dialog-description"},e.InfoDescription()),W.default.createElement(re,{href:Vo,target:"_blank",rel:"noopener",onClick:t},e.LearnMore()))),Ar=I({InfoHeader:"Why do I need to log in with Facebook?",InfoDescription:"To use Instagram on Hootsuite, Facebook (which owns Instagram) requires Instagram Business profiles to be connected to a Facebook Page.",LearnMore:"Learn More"})(Ri);var xr=()=>{z(Mt,"open_learn_more_article")},Si=e=>t=>{t.preventDefault(),z(Mt,"open_convert_to_igb_article"),window.open(e,"_blank","noopener")},yr=({onDismiss:e,addInstagramBusinessAccount:t,showRemoveInstagramPersonalExperiment:o,showAuthProcessRebrand:r,$i18n:n})=>{let s=(0,h.useMemo)(()=>h.default.createElement(b,null,h.default.createElement(b.Close,{close:e})),[e]),l=(0,h.useMemo)(()=>h.default.createElement(O.Buttons.PrimaryAction,{onClick:t},n.ConnectThroughFbButton()),[n,t]),m=(0,h.useMemo)(()=>h.default.createElement(h.default.Fragment,null,r?h.default.createElement(Xo,null,s):s,o?h.default.createElement(ar,null,h.default.createElement(cr,{id:"igb-auth-process-dialog-title"},n.DialogTitleIGB())):h.default.createElement(E,null,h.default.createElement(E.Title,{id:"igb-auth-process-dialog-title"},r?n.DialogTitleRebrand():n.DialogTitle()),r?h.default.createElement(E.Description,null,n.DialogDescriptionRebrand()):h.default.createElement(sr,{id:"igb-auth-process-dialog-description"},n.DialogDescription()," ",h.default.createElement(re,{href:qo,target:"_blank",rel:"noopener",onClick:xr},n.LearnMoreDescription())))),[n,r,o,s]),D=(0,h.useMemo)(()=>o?h.default.createElement(Ar,{onHelpLinkClick:xr}):r?h.default.createElement(Tr,null):h.default.createElement(Cr,null),[r,o]),F=(0,h.useMemo)(()=>{let ce=r?er:h.default.Fragment;return h.default.createElement(O,null,h.default.createElement(ce,null,l),o?h.default.createElement(O.Buttons.TertiaryAction,{onClick:e},n.CancelButton()):!r&&h.default.createElement(O.Buttons.TertiaryAction,{onClick:Si(Ko)},n.ConvertToIgbButton()))},[n,r,l,o,e]),$=o?ir:nr;return h.default.createElement(Y,{closeModal:e,ariaLabelledBy:"igb-auth-process-dialog-title",ariaDescribedBy:"igb-auth-process-dialog-description"},h.default.createElement($,null,m,D,F))};yr.displayName="IgbAuthProcessDialog";var Pt=I({DialogTitle:"Log in to Facebook to add Instagram",DialogTitleIGB:"Log in with Facebook to add your Instagram Business profile",DialogTitleRebrand:"Let's get you to the finish line",DialogDescriptionRebrand:"Connect your Business profile to your Facebook Page. Here\u2019s how:",DialogDescription:"Instagram Business profiles have to be connected to Facebook Pages.",LearnMoreDescription:"How to set up Instagram Business",ConvertToIgbButton:"Convert to Instagram Business",ConnectThroughFbButton:"Log in to Facebook",CancelButton:"Cancel"})(yr);Pt.propTypes={onDismiss:i.func.isRequired,addInstagramBusinessAccount:i.func.isRequired,showRemoveInstagramPersonalExperiment:i.bool,showAuthProcessRebrand:i.bool};var _e=({onOpen:e,onDismiss:t,addInstagramBusinessAccount:o,showRemoveInstagramPersonalExperiment:r,showAuthProcessRebrand:n})=>zt.default.createElement(q,{children:({close:s})=>{e(s);let l=m=>{m.stopPropagation(),s(),t(m)};return zt.default.createElement(Pt,{onDismiss:l,addInstagramBusinessAccount:o,showRemoveInstagramPersonalExperiment:r,showAuthProcessRebrand:n})}});_e.displayName="IgbAuthProcessModal";_e.propTypes={onOpen:i.func,onDismiss:i.func,addInstagramBusinessAccount:i.func,showRemoveInstagramPersonalExperiment:i.bool,showAuthProcessRebrand:i.bool};_e.defaultProps={onOpen:()=>{},onDismiss:()=>{},addInstagramBusinessAccount:()=>{},showRemoveInstagramPersonalExperiment:!1,showAuthProcessRebrand:!1};var Er="web.dashboard.instagram_business_auth_process_modal";function _i(e){v.trackCustom(Er,"log_in_clicked");let t=function(){ct.default.emit("socialNetwork:authorize:command","INSTAGRAMBUSINESS",e),n()};var o=document.createElement("div");o.id="igb_auth_process_container",document.body.appendChild(o);var r=null,n=function(){Bt.default.unmountComponentAtNode(o),o.parentNode.removeChild(o),r=function(){},ct.default.emit("modal:close")},s={};return s.onOpen=function(l){r=function(){l(),n()},ct.default.emit("modal:open")},s.onDismiss=function(){v.trackCustom(Er,"cancel_clicked"),n()},hs.isFeatureEnabled("CI_3403_IGB_AUTH_PROCESS_REBRAND")&&(s.showAuthProcessRebrand=!0),s.addInstagramBusinessAccount=t,Bt.default.render(Dr.default.createElement(_e,s),o),{close:r}}var kr=_i;var Kr=a(p()),Kt=a(oe()),je=a(N());var Vt=a(p());T();tt();var U=a(p());T();_();me();P();be();var R=a(p());_();rt();ve();P();T();var Oe=a(p());var Mr=a(p()),Nr=a(Bo()),lt=Nr.default.bind(Mr.default.createElement);T();var Oi=()=>(Date.now()+~~(Math.random()*999999)).toString(36),Ut=e=>e.$$typeof&&e.$$typeof===Symbol.for("react.element"),jt=e=>Array.isArray(e)?e.filter(Boolean).map((t,o)=>Ut(t)?jt((0,Oe.cloneElement)(t,{key:t.key||t.props.key||o})):t):e&&Ut(e)?(0,Oe.cloneElement)(e,{children:Oe.Children.toArray(e.props.children).map(t=>Ut(t)?jt(t):t)}):e,Ft=({size:e,title:t,glyph:o,highlight:r,$theme:n,...s})=>{let l=null;return t!=null&&(l=Oi()),lt`
    <svg
      width=${e}
      height=${e}
      viewBox='0 0 20 20'
      aria-labelledby=${t?l:null}
      ...${s}
    >
      ${t&&lt`<title id=${l}>${t}<//>`}
      ${jt(o({html:lt,highlight:r}))}
    <//>
  `};Ft.propTypes={glyph:i.func.isRequired,size:i.oneOfType([i.string,i.number]),viewBox:i.string,highlight:i.string,title:i.string};Ft.defaultProps={fill:"#2f3638",size:16,highlight:""};var Ce=Ft;var Ht=({html:e})=>e`
  <g>
    <path
      d="M20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0C15.523 0 20 4.477 20 10Z"
      fill="#D93175"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15.9613 12.4753C15.9884 12.0174 16 11.1926 16 9.99806C16 8.80736 15.9884 7.98257 15.9613 7.52469C15.909 6.4395 15.5837 5.60019 14.9894 5.00678C14.3959 4.41336 13.5595 4.091 12.4753 4.03872C12.0174 4.01162 11.1926 4 9.99806 4C8.80736 4 7.98257 4.01162 7.52469 4.03872C6.4395 4.091 5.60019 4.41336 5.00678 5.00678C4.41336 5.60019 4.091 6.44046 4.03872 7.52469C4.01162 7.98257 4 8.80736 4 9.99806C4 11.1926 4.01162 12.0174 4.03872 12.4753C4.091 13.5605 4.41336 14.3959 5.00678 14.9894C5.60019 15.5837 6.44046 15.909 7.52469 15.9613C7.98257 15.9884 8.80736 16 9.99806 16C11.1926 16 12.0174 15.9884 12.4753 15.9613C13.5605 15.909 14.3959 15.5837 14.9894 14.9894C15.5837 14.3959 15.909 13.5595 15.9613 12.4753ZM9.99806 5.07841C9.96418 5.07841 9.76379 5.07841 9.40077 5.07454C9.12586 5.07066 8.85091 5.07066 8.57599 5.07454C8.32521 5.08041 8.07448 5.08816 7.82381 5.09777C7.55387 5.10622 7.28479 5.13274 7.01839 5.17715C6.79864 5.21491 6.61375 5.26428 6.46273 5.32043C5.94225 5.52969 5.52969 5.94225 5.32043 6.46273C5.26331 6.61375 5.21394 6.79864 5.17715 7.01839C5.13553 7.24105 5.11229 7.51016 5.09777 7.82381C5.08816 8.07448 5.08041 8.32521 5.07454 8.57599C5.07067 8.76573 5.07067 9.04066 5.07454 9.40077C5.07841 9.76379 5.07841 9.96418 5.07841 9.99806C5.07841 10.0368 5.07841 10.2362 5.07454 10.5954C5.07067 10.9584 5.07067 11.2343 5.07454 11.4201C5.07841 11.6089 5.08616 11.8587 5.09777 12.1762C5.11229 12.4898 5.13553 12.759 5.17715 12.9816C5.21491 13.2014 5.26428 13.3863 5.32043 13.5373C5.52969 14.0577 5.94225 14.4703 6.46273 14.6796C6.61375 14.7367 6.79864 14.7861 7.01839 14.8228C7.24105 14.8616 7.51016 14.8877 7.82381 14.9022C8.13746 14.9138 8.39109 14.9216 8.57599 14.9255C8.76573 14.9293 9.04066 14.9293 9.40077 14.9255C9.76379 14.9216 9.96418 14.9216 9.99806 14.9216C10.0368 14.9216 10.2362 14.9216 10.5954 14.9255C10.9584 14.9293 11.2343 14.9293 11.4201 14.9255C11.6089 14.9216 11.8587 14.9138 12.1762 14.9022C12.4898 14.8877 12.759 14.8606 12.9816 14.8228C13.2014 14.7851 13.3863 14.7357 13.5373 14.6796C14.0577 14.4703 14.4703 14.0577 14.6796 13.5373C14.7367 13.3863 14.7861 13.2014 14.8228 12.9816C14.8616 12.759 14.8877 12.4898 14.9022 12.1762C14.9138 11.8587 14.9216 11.6089 14.9255 11.4201C14.9293 11.2343 14.9293 10.9584 14.9255 10.5954C14.9216 10.2373 14.9216 10.0359 14.9216 9.99809V9.99806V9.99804C14.9216 9.96408 14.9216 9.76371 14.9255 9.40077C14.9294 9.12586 14.9294 8.85091 14.9255 8.57599C14.9196 8.32521 14.9118 8.07448 14.9022 7.82381C14.8916 7.55402 14.8651 7.28508 14.8228 7.01839C14.7924 6.82914 14.7444 6.64312 14.6796 6.46273C14.4703 5.94225 14.0577 5.52969 13.5373 5.32043C13.3569 5.25557 13.1709 5.20761 12.9816 5.17715C12.7152 5.13307 12.4461 5.10655 12.1762 5.09777C11.8587 5.08616 11.6089 5.07841 11.4201 5.07454C11.1452 5.07065 10.8703 5.07065 10.5954 5.07454C10.2372 5.07841 10.0358 5.07841 9.99806 5.07841ZM13.7115 7.30591C13.8479 7.17126 13.9228 6.98639 13.9187 6.79477H13.9197C13.9197 6.59826 13.8519 6.42885 13.7115 6.28848C13.5779 6.15056 13.3934 6.07386 13.2014 6.07648C13.0106 6.07458 12.8275 6.15125 12.6951 6.28848C12.5547 6.42885 12.4821 6.59826 12.4821 6.79477C12.4795 6.98677 12.5562 7.17134 12.6941 7.30494C12.8266 7.44277 13.0102 7.51982 13.2014 7.51791C13.3934 7.52053 13.5779 7.44383 13.7115 7.30591ZM13.0765 9.99806C13.0765 10.8529 12.7773 11.5789 12.1801 12.1801C11.607 12.7663 10.8177 13.0906 9.99806 13.0765C9.17955 13.0904 8.39153 12.7661 7.81994 12.1801C7.23369 11.607 6.90944 10.8177 6.92352 9.99806C6.92352 9.14714 7.22265 8.41723 7.81994 7.81994C8.39153 7.2339 9.17955 6.90959 9.99806 6.92352C10.8529 6.92352 11.5789 7.22265 12.1801 7.81994C12.7661 8.39153 13.0904 9.17955 13.0765 9.99806ZM11.9981 9.99806C12.0078 9.46686 11.7956 8.95565 11.4124 8.58761C11.043 8.20458 10.531 7.99241 9.99903 8.00194C9.44627 8.00194 8.97677 8.19458 8.58761 8.58761C8.20444 8.95565 7.99216 9.46686 8.00194 9.99806C8.00194 10.5499 8.19458 11.0232 8.58761 11.4124C8.95565 11.7956 9.46686 12.0078 9.99806 11.9981C10.5304 12.0077 11.0427 11.7956 11.4124 11.4124C11.8054 11.0232 11.9981 10.5508 11.9981 9.99903V9.99806Z"
      fill="white"
    />
  </g>
`;var br="https://i.hootsuite.com",vr=`${br}/assets/channel-integrations/instagram_type_personal_bike.svg`,Rr=`${br}/assets/channel-integrations/instagram_type_business_collab.svg`,we="web.auth.select_instagram_type_modal";var Sr=({html:e})=>e`
<g>
  <path
    fill="#1877F2"
    d="M20,10c0-5.523-4.477-10-10-10S0,4.477,0,10c0,4.991,3.657,9.128,8.438,9.878v-6.988H5.898V10h2.539V7.797 c0-2.506,1.493-3.891,3.777-3.891c1.094,0,2.238,0.195,2.238,0.195v2.461h-1.261c-1.242,0-1.63,0.771-1.63,1.562V10h2.773 l-0.443,2.891h-2.33v6.988C16.343,19.128,20,14.991,20,10z"
  />
  <path
    fill="#FFFFFF"
    d="M13.893,12.891L14.336,10h-2.773V8.124c0-0.791,0.387-1.562,1.63-1.562h1.261V4.102 c0,0-1.144-0.195-2.238-0.195c-2.284,0-3.777,1.384-3.777,3.891V10H5.898v2.891h2.539v6.988C8.947,19.958,9.468,20,10,20 s1.053-0.042,1.562-0.122v-6.988H13.893z"
  />
</g>
`;var _r=w(c.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  padding: 10px;
  background: ${u(e=>e.colors.lightGrey10)};
  border: 1px solid ${u(e=>e.colors.primary10)};
  border-radius: 2px;
  box-shadow: 4px 4px 0 0 ${u(e=>e.colors.primary10)};
  transition: all 0.1s ease-in-out;

  &&:hover,
  &&:focus {
    border: 2px solid ${u(e=>e.colors.focusBorder)};
    padding: 9px;
  }

  &&:hover {
    box-shadow: 4px 4px 0px 0px
      ${u(e=>e.colors.complementaryOrange40)};
  }
`),Li=w(c.span`
  position: absolute;
  top: 0;
  right: 0;
  display: inline-flex;
  align-items: center;
  height: 32px;
  flex: 0 1 auto;
  margin: 0;
  padding: 6px 16px;
  overflow: hidden;
  box-sizing: border-box;
  border-radius: 50px;
  background-color: ${()=>u(e=>e.colors.tag.background)};
  font-size: ${()=>u(e=>e.typography.label.size)};
  font-weight: ${()=>u(e=>e.typography.label.weight)};
  line-height: ${()=>u(e=>e.typography.label.lineHeight)};
  color: ${()=>u(e=>e.colors.tag.text)};
`),Or=c.span`
  display: inline-block;
  font-weight: bold;
`,Pi=c.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 30px;
  padding-top: 15px;
  padding-right: 60px;
`,Lr=c.div`
  margin-top: 15px;
  margin-bottom: 15px;
`,zi=c(Ce)`
  margin-left: -4px;
  z-index: 1;
`,Bi=({onClickInstagramPersonal:e,onClickInstagramBusiness:t,$i18n:o})=>{let r=()=>{z(we,"clicked_on_instagram_business_button"),t()},n=()=>{z(we,"clicked_on_instagram_personal_button"),e()};return R.default.createElement(Pi,null,R.default.createElement(_r,{onClick:n},R.default.createElement("img",{src:vr,alt:"",width:"200",height:"190"}),R.default.createElement(Or,null,o.InstagramPersonalTag()),R.default.createElement(Lr,null,R.default.createElement(Ce,{glyph:Ht,size:"40px","aria-hidden":"true"}))),R.default.createElement(_r,{onClick:r},R.default.createElement("img",{src:Rr,alt:"",width:"200",height:"190"}),R.default.createElement(Or,null,o.InstagramBusinessTag()),R.default.createElement(Lr,null,R.default.createElement(Ce,{glyph:Sr,size:"40px","aria-hidden":"true"}),R.default.createElement(zi,{glyph:Ht,size:"40px","aria-hidden":"true"}))),R.default.createElement(Li,null,o.RecommendedTag()))},Wt=I({InstagramBusinessTag:"Instagram Business",InstagramPersonalTag:"Instagram Personal",RecommendedTag:"Recommended"})(Bi);Wt.propTypes={onClickInstagramPersonal:i.func.isRequired,onClickInstagramBusiness:i.func.isRequired};var G=a(p());_();rt();P();ve();pe();var J=a(p());_();T();Oo();var ut=a(p());_();var Ui=c.div`
  position: relative;
`,Pr=(0,ut.forwardRef)((e,t)=>ut.default.createElement(Ui,{ref:t,role:"combobox","aria-labelledby":e?.labelId??void 0,"aria-label":e?.labelId?void 0:e?.label||"Toggle Dialog","aria-haspopup":"dialog","aria-controls":`dropdown-list-${e?.drawerId}`,"aria-expanded":e?.isOpen?"true":"false",...e},e.anchor(e)));var Gt=a(p());_();_();ve();var zr=w(c.div`
  ${e=>e.maxHeight&&`
    max-height: ${e.maxHeight};
    overflow-y: auto;
  `}
  position: relative;
  color: ${()=>u(e=>e.colors.darkGrey)};
  background: ${()=>u(e=>e.colors.dropdownMenu.background)};
  box-shadow: 0 0 0 2px
    ${()=>u(e=>e.colors.dropdownMenu.border)};
  box-sizing: border-box;
  margin: 2px;
`);window.provisionedIndexValue||(window.provisionedIndexValue=2e3);var Br=function(e){let t=window.provisionedIndexValue;return t+=2,window.provisionedIndexValue=t,e&&(t+=e),t};var Le="bottom left",Z="bottom middle",Pe="bottom right",ze="top left",ie="top middle",Be="top right";var Ur=8,jr=0,ji=()=>(jr++,`${jr}`),Fi=_o`
  0% { opacity: 0 }
  100% { opacity: 1 }
`,Hi=e=>({bottom:`top: 100%; margin-top: ${Ur}px;`})[e.attachmentPosition.split(" ")[0]]||`bottom: 100%; margin-bottom: ${Ur}px;`,Wi=e=>({left:"left: 0px;",right:"right: 0px;"})[e.attachmentPosition.split(" ")[1]]||"right: 50%; transform: translateX(50%);",Gi=c.div`
  display: ${e=>e.isOpen?"block":"none"};
  position: absolute;
  background: transparent;
  box-sizing: border-box;
  z-index: ${e=>e.zIndex};
  ${Hi}
  ${Wi}
  width: max-content;
  ${e=>e.minWidth&&`min-width: ${e.minWidth};`}
  ${e=>e.maxWidth&&`max-width: ${e.maxWidth};`}

  animation-duration: 0.15s;
  animation-name: ${Xe`${Fi}`};
  animation-iteration-count: 1;
  animation-delay: 0ms;
`,$t=({afterDropdownRender:e,attachmentPosition:t=Z,children:o,drawerId:r,handleKeyDown:n,innerRef:s,isOpen:l,maxHeight:m,minWidth:D,maxWidth:F,onClick:$,onBlur:ce})=>{let qe=t.split(" ")[0].toLowerCase()==="top",le=r??ji();return Gt.default.createElement(Gi,{isOpen:l,attachmentPosition:t,minWidth:D,maxWidth:F,ref:s,zIndex:Br(),onClick:$,onBlur:ce,tabIndex:0,role:"dialog",id:`dropdown-list-${le}`},Gt.default.createElement(zr,{isTop:qe,maxHeight:m,onKeyDown:n,ref:e},o))};var $i={[Le]:ze,[Z]:ie,[Pe]:Be,[ze]:Le,[ie]:Z,[Be]:Pe},Fr=0,Yi=()=>(Fr++,`${Fr}`),Vi=c.div`
  position: relative;
  display: inline-block;
  ${e=>e.containerWidth&&`width: ${e.containerWidth};`};
`,Hr=e=>{let o=e instanceof HTMLElement&&window.getComputedStyle(e).overflowY,r=o!=="visible"&&o!=="hidden";if(e){if(r&&e.scrollHeight>=e.clientHeight)return e}else return null;return Hr(e.parentNode)||document.body},Ki=e=>{e.style.display="block";let t=parseInt(getComputedStyle(e).getPropertyValue("height"));return e.removeAttribute("style"),t},qi=(e,t,o,r)=>{if(!o||!r)return e;let n=e,l=Hr(r).getBoundingClientRect().top,D=o.getBoundingClientRect().top-l,F=o.getBoundingClientRect().bottom,ce=window.innerHeight-F,xo=Ki(r),qe=t,le=qe&&parseInt(qe)||xo||80;return(n.includes("bottom")&&ce<le&&D>=le||n.includes("top")&&D<le&&ce>=le)&&(n=$i[n]),n},se=class extends J.default.Component{constructor(t){super(t),this.open=o=>{this.mount&&!this.state.isOpen&&(Boolean(o)&&this.setAnchorFocusRef(o),this.setState({isOpen:!0}))},this.close=o=>{this.mount&&(this.setState({isOpen:!1}),this.clearSelection())},this.onClickDrawer=o=>{this.props.isClosedOnContentClick&&this.close(o)},this.onBlurDrawer=o=>{let r=o.currentTarget,n=o.relatedTarget;requestAnimationFrame(()=>{r.contains(document.activeElement)||Boolean(n&&this.anchorRef.current&&this.anchorRef.current.contains(n))||this.close(o)})},this.handleAnchorClick=o=>{let{isOpen:r}=this.state;r?this.close():(this.selectNextItem(),this.open(o))},this.handleKeyDown=o=>{let{isOpen:r}=this.state;switch(o.keyCode){case 13:!r&&this.selectNextItem(),!r&&this.open(o),r&&this.close(o),o.preventDefault();break;case 9:r&&this.close();break;case 40:!r&&this.open(o),this.selectNextItem(),o.preventDefault();break;case 38:!r&&this.open(o),this.selectPreviousItem(),o.preventDefault();break;case 27:r&&(this.close(),this.focusAnchor(),o.preventDefault(),o.stopPropagation());break}},this.setAnchorFocusRef=o=>{this.focusRef.current=o.target},this.focusAnchor=()=>{this.focusRef.current&&this.focusRef.current.focus()},this.afterDrawerRender=o=>{this.drawerRef.current=o},this.afterDropdownRender=o=>{let{maxHeight:r}=this.props;r&&this.registerScrollContainer(o),this.buildItemList(o)},this.buildItemList=o=>{o&&(this.itemRefs=Array.from(o.querySelectorAll("[data-is-dropdown-item]")))},this.registerScrollContainer=o=>{this.scrollContainerRef=o},this.setSelectedItem=o=>{this.selectedItem=o,this.scrollItemIntoView(),this.focusSelectedItem()},this.focusSelectedItem=()=>{if(this.drawerRef.current&&!this.drawerRef.current.contains(document.activeElement)&&this.drawerRef.current.focus(),!Number.isInteger(this.selectedItem))return;let o=this.itemRefs[this.selectedItem];o&&o.focus()},this.scrollItemIntoView=()=>{if(!this.scrollContainerRef||typeof this.scrollContainerRef.scrollIntoView!="function"||!Number.isInteger(this.selectedItem))return;let o=this.itemRefs[this.selectedItem];this.scrollContainerRef.scrollIntoView(o)},this.selectFirstItem=()=>{this.setSelectedItem(0)},this.selectLastItem=()=>{let o=this.itemRefs.length-1;this.setSelectedItem(o)},this.clearSelection=()=>{this.setSelectedItem(void 0)},this.selectNextItem=()=>{this.itemRefs.length!==0&&(Number.isInteger(this.selectedItem)?this.incrementSelectedItem():this.selectFirstItem())},this.selectPreviousItem=()=>{this.itemRefs.length!==0&&(Number.isInteger(this.selectedItem)?this.decrementSelectedItem():this.selectLastItem())},this.incrementSelectedItem=()=>{if(this.itemRefs.length===this.selectedItem+1)return this.selectFirstItem();this.setSelectedItem(this.selectedItem+1)},this.decrementSelectedItem=()=>{if(this.selectedItem===0)return this.selectLastItem();this.setSelectedItem(this.selectedItem-1)},this.state={isOpen:!1},this.selectedItem=void 0,this.itemRefs=[],this.drawerId=et()||Yi(),this.drawerRef=J.default.createRef(null),this.anchorRef=J.default.createRef(null),this.focusRef=J.default.createRef(null),this.close=this.close.bind(this)}componentDidMount(){this.mount=!0,this.props.startOpen&&this.open(),this.props.utils({openDropdown:this.open,closeDropdown:this.close}),this.props.getDrawerRef(this.drawerRef.current)}componentDidUpdate(t,o){this.focusSelectedItem();let r=!o.isOpen&&this.state.isOpen,n=o.isOpen&&!this.state.isOpen;r?this.props.onShow():n&&this.props.onHide()}componentWillUnmount(){this.mount=!1}render(){let{isOpen:t}=this.state,{Anchor:o,children:r,containerWidth:n,maxHeight:s,minWidth:l,maxWidth:m,className:D}=this.props,F=this.props.hasAttachmentPositionOverride?this.props.attachmentPosition:qi(this.props.attachmentPosition,this.props.maxHeight,this.anchorRef.current,this.drawerRef.current),$={anchor:o,drawerId:this.drawerId,label:this.props?.label,labelId:this.props?.labelId,onClick:this.handleAnchorClick,onKeyDown:this.handleKeyDown};return J.default.createElement(Vi,{containerWidth:n,className:D,"data-testid":"dropdown-container"},J.default.createElement(Pr,{isOpen:t,ref:this.anchorRef,...$}),J.default.createElement($t,{isOpen:t,attachmentPosition:F,maxHeight:s,minWidth:l,maxWidth:m,drawerId:this.drawerId,innerRef:this.afterDrawerRender,handleKeyDown:t?this.handleKeyDown:null,afterDropdownRender:this.afterDropdownRender,onClick:this.onClickDrawer,onBlur:this.props.disableBlur?void 0:this.onBlurDrawer},r))}};se.propTypes={children:i.node.isRequired,Anchor:i.func.isRequired,onHide:i.func,onShow:i.func,isClosedOnContentClick:i.bool,startOpen:i.bool,containerWidth:i.string,maxHeight:i.string,minWidth:i.string,maxWidth:i.string,hasAttachmentPositionOverride:i.bool,attachmentPosition:i.oneOf([Le,Z,Pe,ze,ie,Be]),label:i.string,labelId:i.string,utils:i.func,$dl:i.object,className:i.string,getDrawerRef:i.func,disableBlur:i.bool};se.defaultProps={onHide:()=>{},onShow:()=>{},isClosedOnContentClick:!0,startOpen:!1,disableBlur:!1,attachmentPosition:Z,hasAttachmentPositionOverride:!1,utils:()=>{},getDrawerRef:()=>{}};var Wr=a(p());T();var Gr=({html:e})=>e`
  <path
    d="M10,0 C4.5,0 0,4.5 0,10 C0,15.5 4.5,20 10,20 C15.5,20 20,15.5 20,10 C20,4.5 15.5,0 10,0 Z M11.25,15 L8.75,15 L8.75,8.75 L11.25,8.75 L11.25,15 Z M10,7.5 C9.25,7.5 8.75,7 8.75,6.25 C8.75,5.5 9.25,5 10,5 C10.75,5 11.25,5.5 11.25,6.25 C11.25,7 10.75,7.5 10,7.5 Z"
  />
`;var Qi=c.div`
  max-width: 300px;
  padding: 20px 24px;
  box-sizing: border-box;
`,$r=c.h2`
  font-weight: bold;
  margin-bottom: 8px;
`,Yr=c(V)`
  margin-bottom: 8px;
`,Zi=c(Ce)`
  &&&& {
    display: block;
    padding: 10px 10px;
  }
`,Ji=c.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  padding: 48px 38px 0px 48px;
`,Xi=w(c.button`
  align-items: left;
  display: flex;
  flex-direction: row;
  height: 48px;
  color: ${()=>u(e=>e.colors.hyperlink.color)};
  font-size: ${()=>u(e=>e.typography.hyperlink.size)};
  font-weight: ${()=>u(e=>e.typography.hyperlink.weight)};
  line-height: 35px;

  &&:hover {
    text-decoration: underline;
  }
`),es=w(c.div`
  margin-right: 10px;
  background-color: ${()=>u(e=>e.colors.button.background)};
  width: 36px;
  height: 36px;
  border-radius: 50px;
`),ts=()=>{z(we,"open_not_sure_dropdown")},os=()=>{z(we,"open_help_article")},rs=({$i18n:e})=>{let t=G.default.createElement(Xi,null,G.default.createElement(es,{"aria-labelledby":"not-sure-profile-type-anchor-label"},G.default.createElement(Zi,{glyph:Gr,fill:"currentColor"})),G.default.createElement("span",{id:"not-sure-profile-type-anchor-label"},e.anchorLink()));return G.default.createElement(Ji,null,G.default.createElement(se,{Anchor:()=>t,isClosedOnContentClick:!1,onShow:ts,attachmentPosition:ie},G.default.createElement(Qi,null,G.default.createElement($r,null,e.title()),G.default.createElement(Yr,null,e.content()),G.default.createElement(re,{href:e.helpLink(),target:"_blank",rel:"noopener",onClick:os},e.helpLinkText()))))},Vr=I({anchorLink:"What are the advantages of Instagram Business?",helpLink:"https://help.hootsuite.com/hc/articles/1260804251950",helpLinkText:"How to convert a Personal profile to Business",title:"Business profiles can do more",content:"With a Business profile you get access to Instagram features in Hootsuite such as post engagement, analytics, and direct publishing."})(rs);$r.displayName="NotSureProfileTypeDropdownTitle";Yr.displayName="NotSureProfileTypeDropdownParagraph";re.displayName="NotSureProfileTypeDropdownHelpLink";var ns=c(H)`
  width: 650px;
`,is=c(E.Description)`
  @media (max-height: 600px) {
    display: none;
  }
`,dt=class extends U.default.PureComponent{render(){let{onDismiss:t,onClickInstagramPersonal:o,onClickInstagramBusiness:r,$i18n:n}=this.props;return U.default.createElement(Y,{closeModal:t,ariaLabelledBy:"select-instagram-type-title",ariaDescribedBy:"select-instagram-type-description"},U.default.createElement(ns,null,U.default.createElement(b,null,U.default.createElement(b.Close,{close:t})),U.default.createElement(E,null,U.default.createElement(E.Title,{id:"select-instagram-type-title"},n.DialogTitle()),U.default.createElement(is,{id:"select-instagram-type-description"},n.DialogDescription())),U.default.createElement(Q,null,U.default.createElement(Wt,{onClickInstagramPersonal:o,onClickInstagramBusiness:r}),U.default.createElement(Vr,null))))}};dt.displayName="SelectInstagramProfileTypeDialog";var Yt=I({DialogTitle:"Select your Instagram profile type",DialogDescription:"Due to limits from Instagram, your profile type determines your access to Instagram features in Hootsuite."})(dt);Yt.propTypes={onDismiss:i.func.isRequired,onClickInstagramPersonal:i.func.isRequired,onClickInstagramBusiness:i.func.isRequired};var Ue=({onOpen:e,onDismiss:t,onClickInstagramPersonal:o,onClickInstagramBusiness:r})=>Vt.default.createElement(q,{children:({close:n})=>{e(n);let s=l=>{l.stopPropagation(),n(),t(l)};return Vt.default.createElement(Yt,{onDismiss:s,onClickInstagramPersonal:o,onClickInstagramBusiness:r})}});Ue.displayName="SelectInstagramProfileTypeModal";Ue.propTypes={onOpen:i.func,onDismiss:i.func,onClickInstagramPersonal:i.func,onClickInstagramBusiness:i.func};Ue.defaultProps={onOpen:()=>{},onDismiss:()=>{},onClickInstagramPersonal:()=>{},onClickInstagramBusiness:()=>{}};function ss(e){let t=function(){je.default.emit("socialNetwork:authorize:command","INSTAGRAM",e),s()},o=function(){je.default.emit("socialNetwork:addNetwork:igbAuthProcess",e),s()};var r=document.createElement("div");r.id="select_instagram_profile_type_container",document.body.appendChild(r);var n=null,s=function(){Kt.default.unmountComponentAtNode(r),r.parentNode.removeChild(r),n=function(){},je.default.emit("modal:close")},l={};return l.onOpen=function(m){n=function(){m(),s()},je.default.emit("modal:open")},l.onDismiss=function(){s()},l.onClickInstagramPersonal=t,l.onClickInstagramBusiness=o,Kt.default.render(Kr.default.createElement(Ue,l),r),{close:n}}var qr=ss;var Te=a(C()),pt=a(N());de();k();var Fe=a(C());k();var Qr=a(N());var Zr={renderOrganisationPicker:function(e,t){var o=[];if(hs.canSeeNewAddSnDropdownEnterprise)o=Fe.default.map(e,function(n){return{title:n.name,id:n.organizationId,selected:n.organizationId==t}}).concat([{divider:" "},{title:d._("Private social accounts")}]);else{var r=d._("Private social accounts");o=[{title:r},{divider:d._("Organizations")}].concat(Fe.default.map(e,function(n){return{title:n.name,id:n.organizationId,selected:n.organizationId==t}})),t||(o[0].selected=!0)}this.$("._organizationsDropdownBtn").hsDropdown({data:{items:o},change:Fe.default.bind(this.onOrgDropdownChange,this),select:Fe.default.bind(this.onOrgDropdownSelect,this)}),this.$("._organizationPicker").show()},onOrgDropdownChange:function(e){this.selectedOrganizationId=e&&e.id||null},onOrgDropdownSelect:function(){Qr.default.emit(g.SELECT_ADD_TO_SOCIAL_NETWORKS)}};Me();var Jr=Dt.extend({text:{popupTitle:d._("Transfer social account")},template:"socialnetwork/transfer",params:{modal:!0,resizable:!1,draggable:!0,width:480,closeOnEscape:!0,position:["center",80],zIndex:2004},popupId:"transferSocialNetworkPopup",events:{"click ._submit":"onSubmitClick","click ._cancel":"onCancelClick"},trackingOrigin:"web.dashboard.transfer_network_modal",initialize:function(e){Dt.prototype.initialize.apply(this,arguments),Te.default.each(["createTab","saveCheckbox","isUsedForMemberAuth"],function(o){this.data[o]=!!e[o]},this);var t=this.data.addForOrganization;this.selectedOrganizationId=t&&t.organizationId||""},getTmplData:function(){return this.data},onRender:function(){var e=this.data.manageableOrganizations;e&&this.renderOrganisationPicker(e),v.trackCustom(this.trackingOrigin,"modal_opened"),pt.default.emit("modal:open")},onSubmitClick:function(){var e=this.$("._submit");if(!e.hasClass("_disabled")){e.addClass("_disabled"),hs.throbberMgrObj.add(e);var t=f.serializeObject(this.$("form"));Te.default.extend(t,{toOrganizationId:this.selectedOrganizationId,socialNetworkId:this.data.socialNetwork.socialNetworkId,saveCheckbox:this.options.saveCheckbox,resetTwitterPhotoUpload:this.data.resetTwitterPhotoUpload});var o=Te.default.pick(this.options,"onSuccess","onComplete"),r=Te.default.pick(t,"deleteMessages","createTab");v.trackCustom(this.trackingOrigin,"yes_clicked",r),pt.default.emit("socialNetwork:transfer:command",t,o)}},onCancelClick:function(){v.trackCustom(this.trackingOrigin,"cancel_clicked"),this.close(),pt.default.emit("modal:close")}});Te.default.extend(Jr.prototype,Zr);var Xr=Jr;var tn=a(p()),Zt=a(oe()),ht=a(N());var Qt=a(p());T();tt();var L=a(p());T();_();me();P();be();wi();rt();var en="web.instagram.business.steal.downgrade.error",as="Unable to add this Instagram profile",cs="This profile is connected to another Hootsuite account as an Instagram business profile",ls="Before you can take ownership of it, you'll need to connect it to Hootsuite as an Instagram business profile.",us="Cancel",ds="Connect as Instagram business",ps=c(H)`
  width: 600px;
`,mt=class extends L.default.PureComponent{constructor(t){super(t),this.handleConnectAsInstagramBusiness=this.handleConnectAsInstagramBusiness.bind(this),this.handleCancel=this.handleCancel.bind(this)}handleConnectAsInstagramBusiness(){z(en,"clicked_start_igb_flow"),this.props.connectAsInstagramBusiness()}handleCancel(t){z(en,"clicked_cancel"),this.props.onDismiss(t)}render(){let{$i18n:t}=this.props;return L.default.createElement(Y,{closeModal:this.handleCancel,ariaLabelledBy:"igb-steal-downgrade-error-dialog-title"},L.default.createElement(ps,null,L.default.createElement(b,null,L.default.createElement(b.Close,{close:this.handleCancel})),L.default.createElement(E,null,L.default.createElement(E.Title,{id:"igb-steal-downgrade-error-dialog-title"},t.DialogTitle())),L.default.createElement(Q,null,L.default.createElement(Ho,{type:Fo,titleText:t.InputBannerTitle(),messageText:t.InputBannerDescription()})),L.default.createElement(O,null,L.default.createElement(O.Buttons.PrimaryAction,{onClick:this.handleConnectAsInstagramBusiness},t.ConnectAsInstagramBusinessButton()),L.default.createElement(O.Buttons.TertiaryAction,{onClick:this.handleCancel},t.DismissButton()))))}};mt.displayName="IgbStealDowngradeErrorDialog";var qt=I({DialogTitle:as,InputBannerTitle:cs,InputBannerDescription:ls,DismissButton:us,ConnectAsInstagramBusinessButton:ds})(mt);qt.propTypes={onDismiss:i.func.isRequired,connectAsInstagramBusiness:i.func.isRequired};var He=({onOpen:e,onDismiss:t,connectAsInstagramBusiness:o})=>Qt.default.createElement(q,{children:({close:r})=>{e(r);let n=s=>{s.stopPropagation(),r(),t(s)};return Qt.default.createElement(qt,{onDismiss:n,connectAsInstagramBusiness:o})}});He.displayName="IgbStealDowngradeErrorModal";He.propTypes={onOpen:i.func,onDismiss:i.func,connectAsInstagramBusiness:i.func};He.defaultProps={onOpen:()=>{},onDismiss:()=>{},connectAsInstagramBusiness:()=>{}};function ms(e){let t=function(){ht.default.emit("socialNetwork:addNetwork:igbAuthProcess",e),n()};var o=document.createElement("div");o.id="igb_steal_downgrade_error_container",document.body.appendChild(o);var r=null,n=function(){Zt.default.unmountComponentAtNode(o),o.parentNode.removeChild(o),r=function(){},ht.default.emit("modal:close")},s={};return s.onOpen=function(l){r=function(){l(),n()},ht.default.emit("modal:open")},s.onDismiss=function(){n()},s.connectAsInstagramBusiness=t,Zt.default.render(tn.default.createElement(He,s),o),{close:r}}var on=ms;var fn=a(p()),uo=a(oe()),po=a(N());var lo=a(p());T();tt();var ao=a(p());T();var to=a(p());T();var M=a(p());T();_();me();P();ve();be();pe();Ii();var fs="https://i.hootsuite.com",rn=`${fs}/assets/channel-integrations/tiktok_paywall_illustration.svg`;var gs=w(c(H)`
  background: ${()=>u(e=>e.colors.lightGrey10)};
  width: 650px;
  flex-direction: row;
`),nn=c.div`
  display: flex;
  padding-bottom: 0px;
  flex-direction: column;
  justify-content: flex-start;
  flex-wrap: nowrap;
  align-items: stretch;
  flex: 2;
`,Is=c(nn)`
  justify-content: space-around;
  align-items: stretch;
  margin: 48px 0;
  flex: 1;
`,Cs=c.div`
  background: no-repeat url(${rn});
  width: 100%;
  height: 100%;
  background-size: contain;
`,ws=c(ot)`
  margin: 36px 0 24px 0;
`,Ts=c(V)`
  && {
    margin-bottom: 36px;
    font-size: 16px;
  }
`,As=c.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-top: ${()=>u(e=>e.spacing.spacing48)};
`,xs=w(c(zo)`
  margin-right: ${()=>u(e=>e.spacing.spacing32)};
`),ys=w(c(V)`
  font-weight: ${u(e=>e.typography.fontWeight.normal)};
  background-color: ${u(e=>e.colors.accent)};
  color: ${u(e=>e.colors.darkGrey)};
  border-radius: 20px;
  padding: 2px 16px;
  text-align: center;
`),ft=class extends M.default.PureComponent{render(){let{onDismiss:t,onClickUpgrade:o,upgradeButtonText:r,showBadge:n,$i18n:s}=this.props;return M.default.createElement(Y,{closeModal:t,ariaLabelledBy:"tiktok-business-paywall-title",ariaDescribedBy:"tiktok-business-paywall-description"},M.default.createElement(gs,null,M.default.createElement(b,null,M.default.createElement(b.Close,{close:t})),M.default.createElement(nn,null,M.default.createElement(E,null,M.default.createElement(ws,{id:"tiktok-business-paywall-title"},s.DialogTitle()),M.default.createElement(Ts,{id:"tiktok-business-paywall-description"},s.DialogDescription())),M.default.createElement(Q,null,M.default.createElement(As,null,M.default.createElement(xs,{type:Po,onClick:o},r),n&&M.default.createElement(ys,null,s.BadgeText())))),M.default.createElement(Is,{"aria-hidden":"true"},M.default.createElement(Cs,null))))}};ft.displayName="ResponsivePaywallDialog";var We=I({DialogTitle:"Become a TikTok pro",DialogDescription:"Ready to schedule TikTok videos with ease, keep up with trends, and save serious time? The tools you need are right here \u2014 we got you.",BadgeText:"Limited offer"})(ft);We.propTypes={onDismiss:i.func.isRequired,onClickUpgrade:i.func.isRequired,upgradeButtonText:i.string.isRequired,showBadge:i.bool.isRequired};P();var Jt="production",Xt="staging",Es="dev",eo=()=>{let e=ks(),t=String(Ds().env||e.TARGET||e.NODE_ENV).toLowerCase();return t.includes("dev")?Es:t.includes("stag")?Xt:Jt},Ds=()=>typeof hs<"u"?hs:{},ks=()=>typeof process<"u"&&process.env?process.env:{};var sn=e=>{eo()===Xt||eo()===Jt?(window.dataLayer=window.dataLayer||[],window.dataLayer.push(e)):console.warn(`This would have sent the following data to Google Analytics, but GA tracking is disabled in dev. Use staging or production instead. ${JSON.stringify(e)}`)};var Ms=async()=>window.hs?window.hs.memberId:0,Ct=500,Ns="paywall_engagement",an={freeUser:"tiktok_free_user_upgrade",previousTrial:"tiktok_previous_trial_upgrade"},X={accept:"accept",dismiss:"dismiss",impression:"impression",paywallOpened:"paywall_opened"},cn=async(e,t)=>{Ms().then(o=>{o&&sn({event:Ns,paywall:e,action:t})})},gt=e=>{cn(an.freeUser,e)},ln=()=>{gt(X.impression),gt(X.paywallOpened)},un=()=>{gt(X.accept)},dn=()=>{gt(X.dismiss)},It=e=>{cn(an.previousTrial,e)},pn=()=>{It(X.impression),It(X.paywallOpened)},mn=()=>{It(X.accept)},hn=()=>{It(X.dismiss)};var oo=class extends to.default.PureComponent{constructor(){super(...arguments),this.upgradeWithTracking=()=>{let{onClickUpgrade:t}=this.props;un(),window.setTimeout(t(),Ct)},this.dismissWithTracking=t=>{let{onDismiss:o}=this.props;dn(),o(t)}}componentDidMount(){ln()}render(){let{$i18n:t}=this.props;return to.default.createElement(We,{onDismiss:o=>this.dismissWithTracking(o),onClickUpgrade:()=>this.upgradeWithTracking(),upgradeButtonText:t.UpgradeButtonText(),showBadge:!1})}},ro=I({UpgradeButtonText:"Unlock TikTok"})(oo);ro.propTypes={onDismiss:i.func.isRequired,onClickUpgrade:i.func.isRequired};var no=a(p());T();P();var bs=e=>{mn(),window.setTimeout(e(),Ct)},vs=(e,t)=>{hn(),e(t)},io=class extends no.default.PureComponent{componentDidMount(){pn()}render(){let{onDismiss:t,onClickUpgrade:o,$i18n:r}=this.props;return no.default.createElement(We,{onDismiss:n=>vs(t,n),onClickUpgrade:()=>bs(o),upgradeButtonText:r.UpgradeButtonText(),showBadge:!0})}},so=I({UpgradeButtonText:"Try it, 50% off"})(io);so.propTypes={onDismiss:i.func.isRequired,onClickUpgrade:i.func.isRequired};var co=({paywallType:e,onDismiss:t,onClickUpgrade:o})=>{switch(e){case"PREVIOUSTRIAL":return ao.default.createElement(so,{onDismiss:t,onClickUpgrade:o});case"FREEUSER":default:return ao.default.createElement(ro,{onDismiss:t,onClickUpgrade:o})}};co.propTypes={paywallType:i.string,onDismiss:i.func,onClickUpgrade:i.func};var Ge=({onOpen:e,onDismiss:t,onClickUpgrade:o,paywallType:r})=>lo.default.createElement(q,{children:({close:n})=>{e(n);let s=l=>{l.stopPropagation(),n(),t(l)};return lo.default.createElement(co,{paywallType:r,onDismiss:s,onClickUpgrade:o})}});Ge.displayName="TikTokBusinessPaywallModal";Ge.propTypes={onOpen:i.func,onDismiss:i.func,onClickUpgrade:i.func,paywallType:i.string};Ge.defaultProps={onOpen:()=>{},onDismiss:()=>{},onClickUpgrade:()=>{},paywallType:""};function Rs(){let e={freeUser:{url:"/upgrade/tiktok",type:"FREEUSER"},previousTrial:{url:"/billing/change?to=PROFESSIONAL_PLAN&promo=xw50",type:"PREVIOUSTRIAL"}},o=function(){return hs.isFeatureEnabled("TIKTOK_PAYWALL_PREVIOUS_TRIAL")?e.previousTrial:e.freeUser}(),r=function(){window.location.href=o.url,l()};var n=document.createElement("div");n.id="tiktok_business_paywall_container",document.body.appendChild(n);var s=null,l=function(){uo.default.unmountComponentAtNode(n),n.parentNode.removeChild(n),s=function(){},po.default.emit("modal:close")},m={};return m.onOpen=function(D){s=function(){D(),l()},po.default.emit("modal:open")},m.onDismiss=function(){l()},m.onClickUpgrade=r,m.paywallType=o.type,uo.default.render(fn.default.createElement(Ge,m),n),{close:s}}var gn=Rs;Do();var Cn=a(fi()),mo=a(N());function Ss(e){try{let n=document.getElementById(e);if(!n){let s=document.createElement("div");s.id=e,document.body.appendChild(s),n=document.getElementById(e)}var t=window.innerWidth<480;if(!t){var o=720,r=736;let s=(window.outerHeight-r)/2,l=(window.innerWidth-o)/2;n.style.position="absolute",n.style.width=o.toString()+"px",n.style.height=r.toString()+"px",n.style.top=(s/window.outerHeight*100).toString()+"%",n.style.left=(l/window.innerWidth*100).toString()+"%"}return n}catch(n){let s={errorMessage:JSON.stringify(n.message),stack:JSON.stringify(n.stack)};return(0,Cn.logError)("auth_success_modal","Could not return container for mounting Auth Success Modal",s),null}}function In(e){let t=Ss("auth_success_modal_container");if(!t)return;let o=function(){ue("hs-app-auth-modals").then(function(s){s.unmount(t)}),t.parentNode.removeChild(t),mo.default.emit("modal:close")},r={};r.onClose=function(){o()};var n=e.organizationName??"private social accounts";r.socialAccounts=[{name:e.username,avatar:e.avatar,group:n,socialNetwork:e.profileType,socialNetworkId:e.socialNetworkId}],ue("hs-app-auth-modals").then(function(s){s.mountAuthSuccessModal(t,r),mo.default.emit("modal:open")})}function wn(e){document.readyState==="complete"||document.readyState==="loaded"?In(e):document.addEventListener("DOMContentLoaded",()=>In(e),{once:!0})}var Tn={IgbAuthProcessModal:kr,SelectInstagramProfileTypeModal:qr,AddSocialAccountModal:$o,TransferNetworkModal:Xr,IgbStealDowngradeErrorModal:on,TikTokBusinessPaywallModal:gn,AuthSuccessModal:wn};var _s=45,An=ko.extend({messageEvents:{"socialNetwork:addNetwork:igbAuthProcess":"igbAuthProcess","socialNetwork:authorize:command":"authorizeCommand","socialNetwork:addAccount:command":"addAccountCommand","socialNetwork:deleteAccount:command":"deleteAccountCommand","socialNetwork:reauthorize:command":"reauthorizeNetworkCommand","socialNetwork:transfer:command":"transferNetworkCommand","socialNetwork:refresh:command":"refreshNetworkCommand","socialNetwork:sync:command":"syncNetworkCommand","socialNetwork:storePreference:command":"storePreferenceCommand"},text:{transferError:d._("There was an error transferring the social network, please try again"),deleteError:d._("Cannot delete network at this time. Please try again."),deleteAuthError:d._("You don't have permission to delete this social network"),devDeleteNoSnIdError:"You must specify a snId when you call the deleteAccountCommand"},onInitialize:function(e){if(e=e||{},!e.connectorClasses)throw new Error("You must supply connectorClasses to the SocialNetworkService");var t={};if(K.default.each(e.connectorClasses,function(o,r){t[r]=new o,t[r].setNetworkType(r)}),this.connectors=t,!e.snResource)throw new Error("You must supply snResource to the SocialNetworkService");this.snResource=e.snResource},getConnectorByNetwork:function(e){var t=Ne.getSocialNetworkFromType(e);return this.connectors[t]?this.connectors[t]:null},igbAuthProcess:function(e){Tn.IgbAuthProcessModal(e)},authorizeCommand:function(e,t){t=t||{};var o=this.getConnectorByNetwork(e);f.boolToForm(t,"useRedirect"),o?(hs.track("/ga/settings/add-sn/"+o.type.toLowerCase()+"/connect"),o.connect(t).fail(function(r){r.shouldShowError&&x.default.emit("socialNetwork:authorize:error",r,e)})):x.default.emit("socialNetwork:authorize:error",{developerMessage:"There was no connector of type "+e},e)},addAccountCommand:function(e,t,o){t=t||{},t.socialNetwork=t.socialNetwork||{},t.socialNetwork.type=e,t.form_submit="form",t.organizationId===null&&delete t.organizationId,t.isPvp=this.checkPvp(),f.boolToForm(t,"createTab","follow");var r={url:"/ajax/network/add",data:t};this.hackInAjaxCallbacks(o,r),f.promiseRealSuccess(ajaxCall(r,"q1")).done(function(n){K.default.extend(n,K.default.pick(t,"isMultiIdentity","uiContext")),n.success?x.default.emit(g.SOCIAL_NETWORK_ADD_SUCCESS,n,e):n.errorCode===_s?x.default.emit(g.SOCIAL_NETWORK_ADD_ERROR,n):n.isTransfer&&(n.resetTwitterPhotoUpload=!0,x.default.emit(g.SOCIAL_NETWORK_ADD_TRANSFER,n,e,t))}).fail(function(n,s,l,m){m=m||{},m.errorThrown=l,x.default.emit(g.SOCIAL_NETWORK_ADD_ERROR,m,e)})},checkPvp:function(){var e=window.location.href.search("pvp");return e>0},hackInAjaxCallbacks:function(e,t){!e||(K.default.isFunction(e.onSuccess)&&(t.success=e.onSuccess),K.default.isFunction(e.onComplete)&&(t.complete=e.onComplete))},deleteAccountCommand:function(e,t){if(!e){x.default.emit("socialNetwork:delete:error",{developerMessage:this.text.devDeleteNoSnIdError});return}K.default.isArray(e)&&(e=e.join(","));var o=this,r={url:"/ajax/network/delete",data:{socialNetworkIds:e}};this.hackInAjaxCallbacks(t,r),f.promiseRealSuccess(ajaxCall(r,"qm")).done(function(){x.default.emit(g.SOCIAL_NETWORK_DELETE_SUCCESS,e)}).fail(function(n){var s=o.text.deleteError;n.status===403&&(s=o.text.deleteAuthError),x.default.emit("socialNetwork:delete:error",{message:s},e)})},reauthorizeNetworkCommand:function(e,t){e=e||{},t=t||{};var o=e.socialNetworkId,r=this.snResource.getSocialNetworkData(o),n=r&&r.type,s=this.getConnectorByNetwork(n)||null;s?(t.snId=o,s.connect(t).done(K.default.bind(this.postReauthorize,this,n,e,t.permissionRequest)).fail(function(l){l.shouldShowError&&x.default.emit("socialNetwork:reauthorize:error",l,s.type,t.permissionRequest)})):x.default.emit("socialNetwork:reauthorize:error",{developerMessage:"Couldn't locate a connector for snId: "+o},null)},postReauthorize:function(e,t,o){var r=this;f.boolToForm(t,"isSecurePost");var n={socialNetwork:t};f.promiseRealSuccess(ajaxCall({url:"/ajax/network/edit",data:n},"qm")).done(function(s){x.default.emit("socialNetwork:reauthorize:success",s,e,o),e===Mo.c.FACEBOOK&&r.facebookPostChangeCommand({snId:t.socialNetworkId}),r.refreshNetworkCommand()}).fail(function(s,l,m,D){x.default.emit("socialNetwork:reauthorize:error",D,e,o)})},transferNetworkCommand:function(e,t){f.boolToForm(e,"createTab","saveCheckbox","deleteMessages");var o={url:"/ajax/network/transfer",data:e};this.hackInAjaxCallbacks(t,o),f.promiseRealSuccess(ajaxCall(o,"qm")).done(function(r){x.default.emit(g.SOCIAL_NETWORK_TRANSFER_SUCCESS,r)}).fail(function(r,n,s,l){x.default.emit(g.SOCIAL_NETWORK_TRANSFER_ERROR,l)})},refreshNetworkCommand:function(e){var t=this,o={url:"/ajax/network/refresh-social-networks",type:"GET"};this.hackInAjaxCallbacks(e,o),ajaxCall(o,"q1").done(function(r){t.snResource.update(r),x.default.emit("socialNetwork:refresh:success",r)}),x.default.emit("adAccount:refresh:command")},syncNetworkCommand:function(e,t){var o=this,r={url:"/ajax/network/sync",data:{socialNetworkId:e}};this.hackInAjaxCallbacks(t,r),f.promiseRealSuccess(ajaxCall(r,"qm")).done(function(n){o.snResource.update(n),x.default.emit("socialNetwork:sync:success",n,e)})},storePreferenceCommand:function(e,t,o,r){r=r||{};var n=this;f.promiseRealSuccess(ajaxCall({type:"POST",url:"/ajax/member/update-social-network-extra",data:{snId:e,key:t,value:o}},"q1")).done(function(){r.isSoftRefresh?(n.snResource.updateCacheItem(e,t,o),K.default.isFunction(r.onSuccess)&&r.onSuccess()):n.refreshNetworkCommand(K.default.pick(r,"onSuccess"))})}});var ii=a(C());var zn=a(C());var To=a(Qe()),yt=a(C());de();var Ye=a(N());var Ee=a(Qe()),ye=a(C());de();var xn={ADS:"ads"};Object.freeze(xn);var yn=xn;var Nn=a(p()),Io=a(oe());var Mn=a(p());T();var go=a(p());T();var wt=a(p()),ho=a(oe());T();_();window.provisionedIndexValue||(window.provisionedIndexValue=2e3);var En=function(e){let t=window.provisionedIndexValue;return t+=2,window.provisionedIndexValue=t,e&&(t+=e),t};Oo();var Os="_lightboxContainer",Ls="80px",Ps=27,zs=c.div`
  position: fixed;
  display: flex;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: ${e=>e.zIndex};
  justify-content: center;
  align-items: center;
  padding: ${Ls};
  backdrop-filter: blur(10px);

  // on small displays and zoomed large displays, reduce padding to give children as much space as possible
  // when zooming, kicks in roughly around 175% on a 13" laptop
  @media (max-width: 960px) {
    padding: 4%;
  }
`,Ae=class extends wt.Component{constructor(t){super(t),this.isAllowedToClose=!0,this.lightboxContainer=document.createElement("div"),this.lightboxContainer.id=`${Os}-${et()}`,this.allowClose=this.allowClose.bind(this),this.closeAndRemove=this.closeAndRemove.bind(this),this.onBackgroundClick=t.onBackgroundClick}allowClose(t){this.isAllowedToClose=t}closeAndRemove(t){let o=!0;t&&typeof t=="function"&&(o=t()),typeof o!="boolean"&&(o=!0),this.isAllowedToClose&&o&&(ho.default.unmountComponentAtNode(this.lightboxContainer),this.props.onClose())}componentDidMount(){document.body.appendChild(this.lightboxContainer),this.renderToContainer()}componentDidUpdate(){this.renderToContainer()}componentWillUnmount(){document.body.removeChild(this.lightboxContainer)}renderToContainer(){ho.default.render(wt.createElement(zs,{zIndex:En(),onClick:t=>{if(t.target===this.lightboxContainer.children[0])return this.closeAndRemove(this.onBackgroundClick)},onKeyDown:t=>{let{keyCode:o}=t;if(o===Ps)return this.closeAndRemove(this.onBackgroundClick)}},this.props.children({close:this.closeAndRemove,allowClose:this.allowClose})),this.lightboxContainer)}render(){return null}};Ae.propTypes={children:Je.isRequired,onBackgroundClick:Je,onClose:Je};Ae.defaultProps={onBackgroundClick:()=>!1,onClose:()=>{}};var S=a(p());T();_();me();P();Ci();be();pe();var Bs=Uo(H,"AuthDialog"),Dn=c(ot)`
  margin: 36px 0 24px 0;
`,kn=c(V)`
  && {
    margin-bottom: 36px;
    font-size: 16px;
  }`,Us=c.div`
  && div > button {
    background-color: #ccd5d6 !important;
    &:focus,
    &:hover,
    &:active,
    &:hover:not([disabled]):not(:active) {
      background-color: #ccd5d6 !important;
      filter: brightness(110%) !important;
    }
    &:focus-visible{
      box-shadow: 0 0 0 3px #00A68A !important;
    }
  }
`,js=c.div`
  && > button {
    background-color: #012B3A !important;
    color: #ffffff !important;
    &:hover {
      background-color: #004963 !important;
    }
    &:focus {
      background-color: #004963 !important;
    }
    &:active {
      background-color: #001821 !important;
    }
    &:disabled {
      background-color: rgba(0, 73, 99, 0.1) !important;
      color: #879596 !important;
    }
    &:focus-visible {
      background-color: #004963 !important;
      box-shadow: 0 0 0 3px #00A68A !important;
    }
  }
`,Fs=c.div`
  && > button {
    background-color: #E3ECED !important;
    color: #012B3A !important;

    &:hover {
      background-color: #DFFFDE !important;
    }
    &:focus {
      background-color: #DFFFDE !important;
    }
    &:active {
      background-color: #87F8AE !important;
    }
    &:disabled {
      background-color: #ECFFEC !important;
      color: #879596 !important;
    }
    &:focus-visible {
      background-color: #DFFFDE !important;
      box-shadow: 0 0 0 3px #00A68A !important;
    }
  }
`,Hs=c(O)`
  background: #FCFCFB;
`,Ws=c(Bs)`
  box-shadow: 0px 4px 44px rgba(0, 0, 0, 0.25);
`;Dn.displayName="AuthFocusModalTitle";kn.displayName="AuthFocusModalDescription";var Gs=({onResume:e,onDismiss:t,$i18n:o})=>S.default.createElement(Y,{closeModal:t,ariaLabelledBy:"auth-focus-dialog-title",ariaDescribedBy:"auth-focus-dialog-description"},S.default.createElement(Ws,null,S.default.createElement(Us,null,S.default.createElement(b,null,S.default.createElement(b.Close,{close:t}))),S.default.createElement(E,null,S.default.createElement(Dn,{id:"auth-focus-dialog-title"},o.DialogTitle()),S.default.createElement(kn,{id:"auth-focus-dialog-description"},o.DialogDescription())),S.default.createElement(Hs,null,S.default.createElement(js,null,S.default.createElement(O.Buttons.PrimaryAction,{onClick:e},o.ResumeNowButtonText())),S.default.createElement(Fs,null,S.default.createElement(O.Buttons.SecondaryAction,{onClick:t},o.DismissButtonText()))))),fo=I({DialogTitle:"Social account setup still in progress",DialogDescription:"There are still a few steps remaining to connect your social account to Hootsuite.",DismissButtonText:"Cancel",ResumeNowButtonText:"Resume setup"})(Gs);fo.propTypes={onResume:i.func,onDismiss:i.func};var Tt=({onOpen:e,onResume:t,onDismiss:o})=>go.default.createElement(Ae,{children:({close:r})=>{e(r);let n=s=>{s.stopPropagation(),r(),o(s)};return go.default.createElement(fo,{onResume:t,onDismiss:n})}});Tt.propTypes={onOpen:i.func,onResume:i.func,onDismiss:i.func};Tt.defaultProps={onOpen:()=>{},onResume:()=>{},onDismiss:()=>{}};var xe=({onOpen:e,onResume:t,onDismiss:o})=>Mn.default.createElement(Tt,{onOpen:e,onResume:t,onDismiss:o});xe.propTypes={onOpen:i.func,onResume:i.func,onDismiss:i.func};xe.defaultProps={onOpen:()=>{}};var bn=a(N());Eo();Me();yo();var ae=function(e,t){this.authEventId=ae.generateEventId(e),this.authPopup=null,this.userDismissedAuthPopup=!1,this.closeAuthFocusModal=function(){},this.options=t||{}};ye.default.extend(ae.prototype,{defaultFeatures:{location:"0",menubar:"0",resizable:"1",scrollbars:"1",statusbar:"0",toolbar:"0",width:"800",height:"450"},customErrorMessage:null,placeholderUrl:hs.util.getUrlRoot()+"/network/network-popup-preloader",start:function(e,t){this._deferred=Ee.default.Deferred(),t=t||{},ye.default.bindAll(this,"redirectExternalLoginPage","onAuthComplete","onAuthRedirectUrlFail"),Ze.init(),v.init("body"),(0,Ee.default)(document).off(this.authEventId).on(this.authEventId,this.onAuthComplete);var o=this.prepareWindowFeatures(t);if(t.direct||e.match(/^https?:\/\//)){var r=e+(t.data?"?"+Ee.default.param(t.data):"");this.authPopup=window.open(r,this.authEventId,o)}else this.authPopup=window.open(this.placeholderUrl,this.authEventId,o),ajaxCall({url:e,data:t.data,type:"GET"},"qm").pipe(function(s){return s.url}).done(this.redirectExternalLoginPage).fail(this.onAuthRedirectUrlFail);var n=!(f.isFireFox&&window.fullScreen);return n&&this.openAuthFocusModal(),this._pollTimer=window.setInterval(this.checkIfUserClosedPopup.bind(this),200),this.promise()},openAuthFocusModal:function(){this.userDismissedAuthPopup=!1;var e=document.createElement("div");e.id="auth_focus_modal_container",document.body.appendChild(e);var t=this,o=function(){Io.default.unmountComponentAtNode(e),e.parentNode.removeChild(e),t.closeAuthFocusModal=function(){}};Io.default.render(Nn.default.createElement(xe,{onOpen:function(r){t.closeAuthFocusModal=function(){r(),o()}},onResume:function(){f.recordAction("social_network.auth.ui.focus",{useEventAsName:!0}),t.authPopup.focus()},onDismiss:function(){bn.default.emit(g.SOCIAL_NETWORK_REAUTH_ERROR,{socialNetwork:{socialNetworkId:t.options.snId}}),f.recordAction("social_network.auth.ui.dismiss",{useEventAsName:!0}),t.authPopup.close(),t.userDismissedAuthPopup=!0}}),e)},checkIfUserClosedPopup:function(){if(!this.authPopup){this.closeAuthFocusModal(),window.clearInterval(this._pollTimer);return}this.authPopup.closed!==!1&&(this.closeAuthFocusModal(),window.clearInterval(this._pollTimer),this.authEventId.toLowerCase()==="extauth_instagram"&&v.trackCustom("web.dashboard.add_social_network","close_popup"),this._deferred.rejectWith(this,[{userClosed:!0,userDismissedAuthPopup:this.userDismissedAuthPopup,customErrorMessage:this.customErrorMessage}]))},promise:function(){return this._deferred&&this._deferred.promise()},prepareWindowFeatures:function(e){e=e||{};var t=ye.default.extend({},this.defaultFeatures,ye.default.pick(e,"width","height"));return t.left=window.outerWidth/2-parseInt(t.width,10)/2+window.screenLeft,t.top=window.outerHeight/2-parseInt(t.height,10)/2+window.screenTop,ye.default.map(t,function(o,r){return r+"="+o}).join(",")},close:function(){this.authPopup&&this.authPopup.close()},resize:function(e,t){this.authPopup&&this.authPopup.window.resizeTo(e+20,t+100)},redirectExternalLoginPage:function(e){this.authPopup.location=e,this.authPopup.focus()},onAuthRedirectUrlFail:function(e){this._deferred.rejectWith(this,[e]),this.close(),this.authPopup=null},onAuthComplete:function(e,t,o){(0,Ee.default)(document).off(this.authEventId),this._deferred.resolveWith(this,[t,o]),!(hs.isFeatureEnabled("ADS_707_ACTIVATE_TWITTER")&&this.options.uiContext===yn.ADS)&&(this.options.redirectUrl?this.authPopup.location.href=this.options.redirectUrl:(this.authPopup&&this.authPopup.close(),this.authPopup=null))}});ae.generateEventId=function(e){return e&&"extAuth_"+e||"extAuth_general"};ae.externalAuthComplete=function(e,t,o){o.errorMessage&&(ae.prototype.customErrorMessage=o.errorMessage),(0,Ee.default)(document).triggerHandler(ae.generateEventId(e),[t,o])};var At=ae;var xt=a(Qe()),vn=a(C());de();Me();var Rn=function(e,t){this.triggerData=t||null};vn.default.extend(Rn.prototype,{start:function(e,t){if(v.trackCustom("RedirectAuthenticator","start"),t=t||{},this._deferred=xt.default.Deferred(),this.triggerData)this._deferred.resolveWith(this,[this.triggerData.authBundle,this.triggerData.extras]);else if(t.direct||e.match(/^https?:\/\//)){var o=e;t.data&&(o+="?"+xt.default.param(t.data)),f.doRedirect(o)}else ajaxCall({url:e,data:t.data,type:"GET"},"qm").pipe(function(r){return r.url}).done(f.doRedirect).fail(this._deferred.reject);return this.promise()},promise:function(){return this._deferred&&this._deferred.promise()},close:xt.default.noop});var Sn=Rn;k();var $e=a(Qe()),Co=a(C()),On=a(p()),wo=a(oe());var j=a(Ti());Eo();Me();var Ln=a(N());de();yo();Ai();k();var ee=function(e,t){this.authEventId=ee.generateEventId(e),this.authPopup=null,this.userDismissedAuthPopup=!1,this.closeAuthFocusModal=function(){},this.options=t||{}},$s=new Map([[j.PRODUCTION,"3562730700678878"],[j.STAGING,"670381344664035"],[j.DEV,"5229865537138528"]]),Ys=new Map([[j.PRODUCTION,"1380743159498868"],[j.STAGING,"372333545248173"],[j.DEV,"873445111235576"]]),_n=hs.util.getUrlRoot()+"/whatsapp/whatsapp-auth-confirm";Co.default.extend(ee.prototype,{customErrorMessage:d._("Unable to complete this operation at this time. Please try again later."),start:function(e,t){return this._deferred=$e.default.Deferred(),this.selectedProfile=null,t=t||{},Co.default.bindAll(this,"onAuthComplete","onAuthError"),Ze.init(),v.init("body"),(0,$e.default)(document).off(this.authEventId).on(this.authEventId,this.onAuthComplete),this.configureAndLoadSDK(),window.addEventListener("message",this.embeddedFlowListener.bind(this)),Wo(kt(e,"POST",{data:t})).then(r=>{if(r.status===200){var n=!(f.isFireFox&&window.fullScreen);n&&this.openAuthFocusModal(),this.waitFor("FB",this.whatsAppEmbeddedLogin.bind(this))}}).catch(()=>{this.onAuthError({userClosed:!1,userDismissedAuthPopup:this.userDismissedAuthPopup,customErrorMessage:this.customErrorMessage})}),this.promise()},loadSDK:function(){var e=document.createElement("script");e.async=!0,e.defer=!0,e.crossOrigin="anonymous",e.src="https://connect.facebook.net/en_US/sdk.js",document.getElementsByTagName("body")[0].prepend(e)},initializeSDKConfig:function(){window.fbAsyncInit=function(){FB.init({appId:$s.get((0,j.env)()),cookie:!0,xfbml:!0,version:"v18.0"})}},waitFor:function(e,t){var o=setInterval(function(){window[e]&&(clearInterval(o),t())},200)},configureAndLoadSDK:function(){let e=this;window.fbAsyncInit||(document.readyState==="complete"||document.readyState==="loaded"?(e.initializeSDKConfig(),e.loadSDK()):document.addEventListener("DOMContentLoaded",function(){e.initializeSDKConfig(),e.loadSDK()}))},embeddedFlowListener:function(e){if(e.origin==="https://www.facebook.com")try{let t=JSON.parse(e.data);t.type==="WA_EMBEDDED_SIGNUP"&&(t.event==="FINISH"&&(this.selectedProfile=t.data.phone_number_id),t.event==="CANCEL"&&this.onAuthError({userClosed:!0,userDismissedAuthPopup:this.userDismissedAuthPopup}))}catch{}},whatsAppEmbeddedLogin:function(){let e=this;FB.getLoginStatus(function(o){o.status==="connected"&&FB.logout()});let t={feature:"whatsapp_embedded_signup",version:2,sessionInfoVersion:2};e.options.snId&&(t.featureType="only_waba_sharing"),FB.login(function(o){if(o.authResponse){let r=o.authResponse.code,n=e.selectedProfile?_n+`?code=${r}&extId=${e.selectedProfile}`:_n+`?code=${r}`;kt(n,"GET").then(l=>{ee.embeddedAuthComplete(l.data.source,l.data.authBundle,l.data.options)}).catch(()=>{e.onAuthError({userClosed:!1,userDismissedAuthPopup:e.userDismissedAuthPopup,customErrorMessage:e.customErrorMessage})})}else e.onAuthError({userClosed:!0,userDismissedAuthPopup:e.userDismissedAuthPopup,customErrorMessage:e.customErrorMessage})},{config_id:Ys.get((0,j.env)()),response_type:"code",override_default_response_type:!0,extras:t})},promise:function(){return this._deferred&&this._deferred.promise()},onAuthComplete:function(e,t,o){(0,$e.default)(document).off(this.authEventId),this.postAuthCleanup(),this._deferred.resolveWith(this,[t,o])},onAuthError:function(e){this.postAuthCleanup(),this._deferred.rejectWith(this,[e])},postAuthCleanup:function(){this.selectedProfile=null,this.closeAuthFocusModal(),this.closeAuthFocusModal=function(){},window.removeEventListener("message",this.embeddedFlowListener.bind(this))},close:function(){},openAuthFocusModal:function(){this.userDismissedAuthPopup=!1;var e=document.createElement("div");e.id="auth_focus_modal_container",document.body.appendChild(e);var t=this,o=function(){wo.default.unmountComponentAtNode(e),e.parentNode.removeChild(e),t.closeAuthFocusModal=function(){}};wo.default.render(On.default.createElement(xe,{onOpen:function(r){t.closeAuthFocusModal=function(){r(),o()}},onResume:function(){},onDismiss:function(){Ln.default.emit(g.SOCIAL_NETWORK_REAUTH_ERROR,{socialNetwork:{socialNetworkId:t.options.snId}}),f.recordAction("social_network.auth.ui.dismiss",{useEventAsName:!0}),t.userDismissedAuthPopup=!0,t.onAuthError({userClosed:!0,userDismissedAuthPopup:t.userDismissedAuthPopup})}}),e)}});ee.generateEventId=function(e){return e&&"extAuth_"+e||"extAuth_general"};ee.embeddedAuthComplete=function(e,t,o){o.errorMessage&&(ee.prototype.customErrorMessage=o.errorMessage),(0,$e.default)(document).triggerHandler(ee.generateEventId(e),[t,o])};var Pn=ee;var Et=function(){yt.default.bindAll(this,"_rejectAuth","cancelAuth","errorAuth"),this.initialize.apply(this,arguments)};yt.default.extend(Et.prototype,{initialize:To.default.noop,cancelConnectMessage:"",networkType:null,setNetworkType:function(e){this.networkType=e},connect:function(e){if(e=e||{},this.isAuthPending())this.cancelAuth(this.getCancelConnectMessage()),this.extAuth&&this.extAuth.close();else{this._authDeferred=To.default.Deferred(),this.options=e,this.extAuth=this.doConnect(e);var t=this.extAuth&&this.extAuth.promise()||null;t&&Object.prototype.hasOwnProperty.call(t,"fail")&&t.fail(yt.default.bind(this.onExternalAuthFail,this))}return this._authDeferred&&this._authDeferred.promise()},doConnect:function(){throw new Error("You must implement doConnect in a subclass. Return the ExternalAuthenticator for error handling.")},getAuthenticator:function(e,t){return e==="whatsapp"&&hs.isFeatureEnabled("CI_4205_WHATSAPP_EMBEDDED_LOGIN")?new Pn(e,t):t.useRedirect?new Sn(e,t.triggerData):new At(e,t)},reconnect:Et.prototype.connect,isAuthPending:function(){return this._authDeferred&&this._authDeferred.state()==="pending"},completeAuth:function(){this._authDeferred=null;var e=this.options;this.options=null;var t={},o=!1,r=0,n=!0,s=0,l="Error";arguments[1]&&(o=arguments[1].isReauth,r=arguments[1].socialNetworkId,n=arguments[1].authFailed,s=arguments[1].errorCode,l=arguments[1].errorMessage),o&&r>0&&(t.socialNetwork={},t.socialNetwork.socialNetworkId=r),n?(t.errorCode=s,t.errorMessage=l,o?Ye.default.emit(g.SOCIAL_NETWORK_REAUTH_ERROR,t,this.snType):(t.options=e,Ye.default.emit(g.SOCIAL_NETWORK_ADD_ERROR,t,this.snType))):(r>0&&(t.socialNetworkId=r),t.success=1,typeof arguments[1].authSuccessFollowup<"u"&&(t.authSuccessFollowup=arguments[1].authSuccessFollowup),typeof arguments[1].authSuccessOne<"u"&&(t.authSuccessOne=arguments[1].authSuccessOne),typeof arguments[1].extendedAuthFlow<"u"&&(t.extendedAuthFlow=arguments[1].extendedAuthFlow),typeof arguments[1].finishWithoutCompletingExtendedAuth<"u"&&(t.finishWithoutCompletingExtendedAuth=arguments[1].finishWithoutCompletingExtendedAuth),typeof arguments[1].isInstagramBusiness<"u"&&(t.isInstagramBusiness=arguments[1].isInstagramBusiness),o?Ye.default.emit(g.SOCIAL_NETWORK_REAUTH_SUCCESS,t,this.snType):Ye.default.emit(g.SOCIAL_NETWORK_ADD_SUCCESS,t,this.snType)),window.onAddSocialNetworkSuccess=void 0},_rejectAuth:function(e,t,o){!this._authDeferred||this._authDeferred.reject({status:e,message:t,shouldShowError:o})},cancelAuth:function(e,t){this._rejectAuth("cancelled",e,t)},errorAuth:function(e){this._rejectAuth("error",e,!0)},onExternalAuthFail:function(e){var t=this.getCancelConnectMessage();if(e.customErrorMessage&&(t=e.customErrorMessage),e.userClosed===!0&&e.userDismissedAuthPopup===!0)this.cancelAuth(t,!1);else if(e.userClosed===!0)this.cancelAuth(t,!0);else{var o=d._("An error occurred while connecting to external API. Please try again later");e.errorCode&&(o+="; Code: "+e.errorCode),this.errorAuth(o)}},getCancelConnectMessage:function(){return this.cancelConnectMessage}});Et.extend=f.extend;var A=Et;var Bn=a(N());k();var Vs=hs.util.getUrlRoot()+"/app/social-network/add?type=FACEBOOK&flowType=MODALS",Ks=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",qs=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Facebook"),snType:"facebook",getAppId:function(){return hs.fbAppId},doConnect:function(e){var t,o,r=this.snType,n=Vs;return e.snId?n=Ks+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(n+="&organizationId="+e.organizationId),t=this.getAuthenticator(r,e),o=t.start(n,{direct:!0,width:900,height:700}),o.done(zn.default.bind(this.completeAuth,this)),window.onAddSocialNetworkSuccess=function(s){Bn.default.emit(g.SOCIAL_NETWORK_ADD_SUCCESS,s,r)},t},prepareTokenData:function(e){return{code:e.token}}}),Un=qs;var jn=a(C());var Fn=a(N());k();var Qs=hs.util.getUrlRoot()+"/app/social-network/add?type=LINKEDIN&flowType=MODALS",Zs=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",Js=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with LinkedIn"),snType:"linkedin",doConnect:function(e){var t,o,r=this.snType,n=Qs;return e.snId?n=Zs+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(n+="&organizationId="+e.organizationId),t=this.getAuthenticator(r,e),o=t.start(n,{direct:!0,width:900,height:500}),o.done(jn.default.bind(this.completeAuth,this)),window.onAddSocialNetworkSuccess=function(s){Fn.default.emit(g.SOCIAL_NETWORK_ADD_SUCCESS,s,r)},t}}),Hn=Js;var De=a(C());k();var Xs=hs.util.getUrlRoot()+"/app/social-network/add?type=TWITTER&flowType=MODALS",ea=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",Wn=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Twitter"),snType:"twitter",doConnect:function(e){var t,o,r=Xs;return e.snId?r=ea+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(r+="&organizationId="+e.organizationId),t=this.getAuthenticator(this.snType,e),o=t.start(r,{direct:!0,width:900,height:450}),o.done(De.default.bind(this.completeAuth,this)),t},storeTokens:function(e,t){ajaxCall({url:"/ajax/twitter/get-oauth-tokens",data:this.prepareTokenData(t,e)},"qm").done(De.default.bind(this.completeAuth,this)).fail(De.default.bind(this.onExternalAuthFail,this))},prepareTokenData:function(e,t){return t=t||{},De.default.extend({ot:e.token,ov:e.verifier},De.default.pick(t,"snId"))}});var Gn=a(C());k();var ta=hs.util.getUrlRoot()+"/app/social-network/add?type=INSTAGRAM&flowType=MODALS",oa=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",$n=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Instagram"),snType:"instagram",doConnect:function(e){var t,o,r=this.snType,n=ta;return e.snId?n=oa+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(n+="&organizationId="+e.organizationId),t=this.getAuthenticator(r,e),o=t.start(n,{direct:!0,width:900,height:450}),o.done(Gn.default.bind(this.completeAuth,this)),t}});var Yn=a(C());k();var Vn=a(N());var ra=hs.util.getUrlRoot()+"/app/social-network/add?type=INSTAGRAMBUSINESS&flowType=MODALS",na=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",ia=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Facebook"),snType:"instagrambusiness",doConnect:function(e){var t,o,r=this.snType,n=ra;return e.snId?n=na+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(n+="&organizationId="+e.organizationId),t=this.getAuthenticator(r,e),o=t.start(n,{direct:!0,width:900,height:450}),o.done(Yn.default.bind(this.completeAuth,this)),window.onAddSocialNetworkSuccess=function(s){Vn.default.emit(g.SOCIAL_NETWORK_ADD_SUCCESS,s,r)},t}}),Kn=ia;var qn=a(C());k();var sa=hs.util.getUrlRoot()+"/app/social-network/add?type=YOUTUBECHANNEL&flowType=MODALS",aa=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",Qn=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with YouTube"),snType:"youtubechannel",doConnect:function(e){var t=sa;e.snId?t=aa+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(t+="&organizationId="+e.organizationId);var o=this.getAuthenticator(this.snType,e),r=o.start(t,{direct:!0,width:900,height:450});return r.done(qn.default.bind(this.completeAuth,this)),o}});var Zn=a(C());k();var ca=hs.util.getUrlRoot()+"/app/social-network/add?type=PINTEREST&flowType=MODALS",la=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",Jn=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Pinterest"),snType:"pinterest",doConnect:function(e){var t=ca;e.snId?t=la+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(t+="&organizationId="+e.organizationId);var o=this.getAuthenticator(this.snType,e),r=o.start(t,{direct:!0,width:670,height:600});return r.done(Zn.default.bind(this.completeAuth,this)),o}});var Xn=a(C());k();var ua=hs.util.getUrlRoot()+"/app/social-network/add?type=TIKTOKBUSINESS&flowType=MODALS",da=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",ei=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with TikTok"),snType:"tiktokbusiness",doConnect:function(e){var t=ua;e.snId?t=da+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(t+="&organizationId="+e.organizationId);var o=this.getAuthenticator(this.snType,e),r=o.start(t,{direct:!0,width:670,height:660});return r.done(Xn.default.bind(this.completeAuth,this)),o}});var ti=a(C());k();var pa=hs.util.getUrlRoot()+"/app/social-network/add?type=WHATSAPP&flowType=MODALS",ma=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",oi=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Whatsapp"),snType:"whatsapp",doConnect:function(e){this.options=e;var t=pa;this.options.snId?t=ma+this.options.snId:this.options&&typeof this.options.organizationId<"u"&&this.options.organizationId&&(t+="&organizationId="+this.options.organizationId);var o=this.getAuthenticator(this.snType,this.options),r=o.start(t,{direct:!0,width:670,height:660});return r.done(ti.default.bind(this.completeAuth,this)),o}});var ri=a(C());k();var ha=hs.util.getUrlRoot()+"/app/social-network/add?type=THREADS&flowType=MODALS",fa=hs.util.getUrlRoot()+"/app/social-network/reauth?flowType=MODALS&socialProfileId=",ni=A.extend({cancelConnectMessage:d._("You must sign in and allow Hootsuite to integrate with Threads"),snType:"threads",doConnect:function(e){var t=ha;e.snId?t=fa+e.snId:e&&typeof e.organizationId<"u"&&e.organizationId&&(t+="&organizationId="+e.organizationId);var o=this.getAuthenticator(this.snType,e),r=o.start(t,{direct:!0,width:670,height:660});return r.done(ri.default.bind(this.completeAuth,this)),o}});var si={FACEBOOK:Un,LINKEDIN:Hn,TWITTER:Wn,INSTAGRAM:$n,INSTAGRAMBUSINESS:Kn,YOUTUBECHANNEL:Qn,PINTEREST:Jn,TIKTOKBUSINESS:ei,WHATSAPP:oi,THREADS:ni};ii.default.each(si,function(e,t){e.prototype.type=t});var ai=si;var te=a(C()),Ao=a(xi()),ke=function(e){this.snCollection=e.snCollection,hs.snCollection=this.snCollection};ke.cacheKeys=["socialNetworks","socialNetworksKeyedByType","pinnedSns","favoritedSns","publisherFilterSns"];ke.cacheKeyMap={pin:"pinnedSns",favorite:"favoritedSns",publisherFilter:"publisherFilterSns"};te.default.extend(ke.prototype,{update:function(e){if(this.updateCacheData(e),e.socialNetworks)this.snCollection.set(te.default.values(e.socialNetworks));else if(e.socialNetwork){var t=e.socialNetwork,o=this.snCollection.get(t.socialNetworkId);o&&o.set(t)}},updateCacheData:function(e){!e||(te.default.each(te.default.pick(e,ke.cacheKeys),function(t,o){hs[o]=t}),e.socialNetworks&&(hs.socialNetworksSorted=null))},updateCacheItem:function(e,t,o){var r=ke.cacheKeyMap[t];r&&e&&(hs[r]=te.default.without(hs[r],e),o&&hs[r].push(e))},getSocialNetworkData:function(e,t){return t?this.snCollection.get(e):hs.socialNetworks[e]||null},updateGlobalCache:function(e){if(te.default.isObject(e)){var t={socialNetworks:hs.socialNetworks};te.default.isObject(e.socialNetwork)&&e.socialNetwork.socialNetworkId?(t.socialNetworks[e.socialNetwork.socialNetworkId]?(0,Ao.default)(t.socialNetworks[e.socialNetwork.socialNetworkId],e.socialNetwork):t.socialNetworks[e.socialNetwork.socialNetworkId]=e.socialNetwork,this.updateCacheData(t)):e.socialNetworks&&((0,Ao.default)(t.socialNetworks,e.socialNetworks),this.updateCacheData(t))}}});var ci=ke;var di=a(jo());var Ve=a(C()),Ke=a(jo());hs.model=hs.model||{};hs.model.BaseModel=function(){var e=function(){Ke.default.Model.apply(this,arguments)};return Ve.default.extend(e.prototype,Ke.default.Model.prototype,{emulatedRestfulSync:function(t,o,r){var n=this,s=r.success,l=r.error;r=Ve.default.omit(r,"success","error");var m={url:this.requestMap[t],data:{},success:function(D,F,$){s.call(n,D,F,$)},error:function(D,F,$){l.call(n,D,F,$)}};return Ve.default.isFunction(this.getRequestData)&&(m.data=this.getRequestData(t)),ajaxCall(Ve.default.extend(m,r),"q1")},restfulSync:function(t,o,r){Ke.default.Model.prototype.sync(t,o,r)},getSyncMethod:function(t){return this.requestMap&&Object.prototype.hasOwnProperty.call(this.requestMap,t)?this.emulatedRestfulSync:this.restfulSync},sync:function(t,o,r){return this.getSyncMethod(t).apply(this,[t,o,r])}}),e.extend=Ke.default.Model.extend,e}();var li=hs.model.BaseModel;var ui=li.extend({idAttribute:"socialNetworkId",requestMap:{delete:"/ajax/network/delete"},getRequestData:function(e){return e=="delete"?{socialNetworkIds:this.id}:{}},getOriginalAvatar:function(){return Ne.getOriginalAvatar(this.get("avatar"))},getNetworkType:function(){return Ne.getSocialNetworkFromType(this.get("type"))||this.get("type")}});var pi=di.default.Collection.extend({model:ui,getMemberAccounts:function(){return this.where({ownerType:"MEMBER",ownerId:hs.memberId})},countMemberAccounts:function(){return this.getMemberAccounts().length}});var mi={shim:function(e,t,o){t=t||{},o=o||{},hs.popauth.triggerCallback(e,t.token,t.verifier,o.userCancelled)}};var am={init:function(e){var t=new ci({snCollection:new pi(hi.default.values(e))}),o=new An({connectorClasses:ai,snResource:t});return window.externalAuthComplete=hs.externalAuthComplete=function(r,n,s){At.externalAuthComplete(r,n,s),mi.shim(r,n,s)},o}};export{Tn as a,yn as b,At as c,ci as d,am as e};
//# sourceMappingURL=chunk-EP65TB4K.js.map
