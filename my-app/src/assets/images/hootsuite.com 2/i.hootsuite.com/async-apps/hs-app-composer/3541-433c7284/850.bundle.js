!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},t=(new Error).stack;t&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[t]="bdcdf3af-750a-45a6-b052-d0d3263de85e",e._sentryDebugIdIdentifier="sentry-dbid-bdcdf3af-750a-45a6-b052-d0d3263de85e")}catch(e){}}();var _global2="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};_global2._sentryModuleMetadata=_global2._sentryModuleMetadata||{},_global2._sentryModuleMetadata[(new Error).stack]={appName:"hs-app-composer",release:"433c728496773fb6b9881b21f96769818607f98f"};var _global="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{};_global.SENTRY_RELEASE={id:"433c728496773fb6b9881b21f96769818607f98f"},(self.webpackChunkhs_app_composer=self.webpackChunkhs_app_composer||[]).push([[850],{53734:(e,t,i)=>{i.r(t),i.d(t,{SingleDateTimePicker:()=>Fe,default:()=>Be});var o=i(67294),s=i(27361),n=i.n(s),a=i(80008),l=i.n(a),r=i(66338),d=i(36005),c=i(27050),p=i(21185),m=i(22317),h=i(44704),u=i(85055),E=i(98781),g=i(37311),D=i(71777),S=i(19609),T=i(7857),_=i(89790),C=i(31294),f=i(7512),y=i(49486),A=i(76309),I=i(99547),M=i(64713),b=i(8535),Z=i(28951),k=i(47101),w=i(7136),N=i(16043),P=i(62872),L=i(48148),v=i(19521),O=i(95985),$=i(89509),U=i(1498);const z=v.ZP.div`
  > div {
    width: 100%;
    display: block;
  }
`,x=(0,O.R)((0,$.Ie)(v.ZP.div`
    display: block;
    padding: ${()=>(0,$.u_)((e=>`${e.spacing.spacing8} ${e.spacing.spacing8} ${e.spacing.spacing12} ${e.spacing.spacing8}`))};
  `),"TimePicker"),H=(0,$.Ie)(v.ZP.div`
  display: grid;
  gap: 0px ${()=>(0,$.u_)((e=>`${e.spacing.spacing4}`))};
  grid-template-columns: 1fr 1fr 1fr;
`),R=(0,$.Ie)(v.ZP.div`
  display: flex;
  padding-top: ${()=>(0,$.u_)((e=>e.spacing.spacing8))};
`),V=(0,O.R)((0,$.Ie)(v.ZP.div`
    flex: 1 1 auto;
    color: ${()=>(0,$.u_)((e=>e.colors.darkGrey80))};
    font-size: ${()=>(0,$.u_)((e=>e.typography.small.size))};
  `),"Timezone"),F=v.iv`
  button {
    width: 100%;
  }
`,B=(0,O.R)((0,v.ZP)(z)`
    ${F};
  `,"HourDropdown"),G=(0,O.R)((0,v.ZP)(z)`
    ${F};
  `,"MinuteDropdown"),W=(0,O.R)((0,v.ZP)(z)`
    ${F};
  `,"PeriodDropdown"),j=(0,$.Ie)((0,v.ZP)(U.h_)`
  padding: 0 ${()=>(0,$.u_)((e=>e.spacing.spacing16))};
`);z.displayName="DropdownMenuContainer",B.displayName="HourDropdown",G.displayName="MinuteDropdown",W.displayName="PeriodDropdown",x.displayName="TimePicker",V.displayName="Timezone",R.displayName="TimezoneContainer";const Y="400px",K="88px",J=S.Z._("Select hour"),X=S.Z._("Select minute"),q=S.Z._("Select AM/PM"),Q=S.Z._("Settings");(0,L.Md)((e=>o.createElement(N.zx,{type:N.Wm,height:N.iq,"aria-label":Q,...e},o.createElement(w.ZP,{glyph:k.Z,fill:"current-color"}))),(()=>({placement:L.SV,text:Q}))).displayName="SettingsButtonWithTooltip";class ee extends o.Component{constructor(e){super(e),this.onDocumentClick=e=>{const t=(t,i)=>{t&&!t.contains(e.target)&&i&&"function"==typeof i.closeDropdown&&i.closeDropdown()};t(this.hourDropdownNode,this.hourDropdownUtils),t(this.minuteDropdownNode,this.minuteDropdownUtils),t(this.periodDropdownNode,this.periodDropdownUtils)},this.hourDropdownNode=null,this.minuteDropdownNode=null,this.periodDropdownNode=null,this.hourDropdownUtils=null,this.minuteDropdownUtils=null,this.periodDropdownUtils=null,this.state={selectedTime:e.selectedTime,isClose:!0}}componentDidMount(){window.addEventListener("click",this.onDocumentClick,!0)}componentWillUnmount(){window.removeEventListener("click",this.onDocumentClick,!0)}handleTimeDropdownChange(e,t){const i=d.ZP.clone(this.state.selectedTime);e===y.Z.SELECTOR.PERIOD?i[e]=t:i[e]=parseInt(t),this.setState({selectedTime:i}),this.props.onTimeChange(i)}renderTimeDropdown(){const{selectedTime:e}=this.state,t=[];d.ZP.times(f.Z.YOUTUBE_SCHEDULER.NUM_HOURS_TO_DISPLAY,(e=>{const i=(e+1).toString();t.push(i)}));const i=d.ZP.map(f.Z.YOUTUBE_SCHEDULER.MINUTES_TO_DISPLAY,(e=>`0${e}`.slice(-2))),s=[f.Z.DATE_TIME.AM,f.Z.DATE_TIME.PM],n=this.state.selectedTime.hour-1,a=this.state.selectedTime.minute/5,l=this.state.selectedTime.period===f.Z.DATE_TIME.AM?0:1;return o.createElement(H,null,o.createElement(B,{ref:e=>this.hourDropdownNode=e},o.createElement(j,{ariaLabel:J,attachmentPosition:P.X6,maxHeight:Y,width:K,defaultLabel:e.hour.toString(),onSelect:e=>this.handleTimeDropdownChange(y.Z.SELECTOR.HOUR,t[e]),utils:e=>this.hourDropdownUtils=e,selectedItem:n},t)),o.createElement(G,{ref:e=>this.minuteDropdownNode=e},o.createElement(j,{ariaLabel:X,attachmentPosition:P.X6,maxHeight:Y,width:K,defaultLabel:e.minute.toString(),onSelect:e=>this.handleTimeDropdownChange(y.Z.SELECTOR.MINUTE,i[e]),utils:e=>this.minuteDropdownUtils=e,selectedItem:a},i)),o.createElement(W,{ref:e=>this.periodDropdownNode=e},o.createElement(j,{ariaLabel:q,attachmentPosition:P.X6,maxHeight:Y,width:K,defaultLabel:e.period,onSelect:e=>this.handleTimeDropdownChange(y.Z.SELECTOR.PERIOD,s[e]),utils:e=>this.periodDropdownUtils=e,selectedItem:l},s)))}render(){const{timeFromGMT:e}=this.props;return o.createElement(x,null,this.renderTimeDropdown(),o.createElement(R,null,o.createElement(V,null,e)))}}ee.displayName="TimePicker",ee.defaultProps={selectedTime:y.Z.DEFAULT_TIME};const te=()=>o.createElement("g",null,o.createElement("path",{d:"M111.124 0H0V61.8545H14.0402L23.7995 78.7766L33.5545 61.8545H111.124V0Z",fill:"#EBF0F5"}),o.createElement("path",{d:"M63.3943 12.2349C61.9129 12.2324 60.448 12.5452 59.0966 13.1526C57.7451 13.76 56.5381 14.6481 55.5555 15.758C53.7314 13.7705 51.2126 12.563 48.5225 12.3865C45.8323 12.21 43.1777 13.078 41.1102 14.8102C39.0426 16.5424 37.7211 19.0055 37.4203 21.6879C37.1194 24.3702 37.8623 27.0655 39.4946 29.2137L55.5598 49.6022L71.6294 29.2137C72.8499 27.6656 73.6103 25.8046 73.8234 23.8439C74.0364 21.8832 73.6936 19.9021 72.8342 18.1274C71.9748 16.3527 70.6335 14.8563 68.9639 13.8095C67.2944 12.7628 65.3642 12.208 63.3943 12.2087V12.2349Z",fill:"#C95960"}),o.createElement("path",{d:"M203.06 68.7043H133.238V107.572H142.061L148.193 118.202L154.325 107.572H203.06V68.7043Z",fill:"#EBF0F5"}),o.createElement("path",{d:"M177.819 91.0506C179.272 91.0506 180.45 89.8715 180.45 88.417C180.45 86.9625 179.272 85.7834 177.819 85.7834C176.367 85.7834 175.189 86.9625 175.189 88.417C175.189 89.8715 176.367 91.0506 177.819 91.0506Z",fill:"#72839B"}),o.createElement("path",{d:"M168.012 91.0506C169.465 91.0506 170.643 89.8715 170.643 88.417C170.643 86.9625 169.465 85.7834 168.012 85.7834C166.559 85.7834 165.382 86.9625 165.382 88.417C165.382 89.8715 166.559 91.0506 168.012 91.0506Z",fill:"#72839B"}),o.createElement("path",{d:"M158.205 91.0506C159.658 91.0506 160.835 89.8715 160.835 88.417C160.835 86.9625 159.658 85.7834 158.205 85.7834C156.752 85.7834 155.575 86.9625 155.575 88.417C155.575 89.8715 156.752 91.0506 158.205 91.0506Z",fill:"#72839B"}),o.createElement("path",{d:"M173.678 25.2547C173.678 21.4602 172.554 17.751 170.449 14.596C168.343 11.441 165.35 8.98204 161.849 7.52997C158.348 6.07789 154.495 5.69796 150.778 6.43822C147.061 7.17849 143.647 9.00569 140.967 11.6888C138.287 14.3719 136.462 17.7903 135.723 21.5118C134.984 25.2334 135.363 29.0909 136.813 32.5965C138.264 36.1021 140.72 39.0984 143.871 41.2065C147.022 43.3146 150.727 44.4398 154.516 44.4398C159.598 44.4398 164.472 42.4185 168.066 38.8206C171.659 35.2227 173.678 30.3429 173.678 25.2547Z",fill:"#FDCC75"}),o.createElement("path",{d:"M154.029 30.6483C154.029 30.6483 154.22 30.4128 154.582 30.016C157.715 26.6222 161.857 24.3297 166.395 23.4783C170.932 22.6269 175.622 23.2621 179.77 25.2895C180.533 25.6601 181.36 26.0395 182.196 26.3883C184.74 27.4249 187.538 27.6681 190.222 27.0859C194.429 26.2139 202.198 25.4334 206 30.6483H154.029Z",fill:"#EBF0F5"}),o.createElement("path",{d:"M182.793 38.7407L183.015 38.4878C184.278 37.1194 185.948 36.1951 187.778 35.8519C189.607 35.5087 191.498 35.7648 193.17 36.5824C193.48 36.7306 193.811 36.8832 194.146 37.0184C195.171 37.4401 196.299 37.5389 197.382 37.3018C199.08 36.9443 202.211 36.6347 203.744 38.7363L182.793 38.7407Z",fill:"#EBF0F5"}),o.createElement("path",{d:"M107.536 91.7178H35.8452V107.598H107.536V91.7178Z",fill:"#D6E1EB"}),o.createElement("path",{d:"M107.536 107.733H35.8452V174H107.536V107.733Z",fill:"#EBF0F5"}),o.createElement("path",{d:"M98.4558 119.261H44.9297V162.472H98.4558V119.261Z",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M44.9297 153.83H98.4558",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M44.9297 145.188H98.4558",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M44.9297 136.545H98.4558",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M44.9297 127.904H98.4558",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M90.8083 119.261V162.472",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M83.1614 119.261V162.472",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M75.5142 119.261V162.472",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M67.8667 119.261V162.472",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M60.2239 119.261V162.472",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M52.5767 119.261V162.472",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M64.017 125.606C65.0752 125.606 65.9331 124.747 65.9331 123.687C65.9331 122.628 65.0752 121.769 64.017 121.769C62.9587 121.769 62.1008 122.628 62.1008 123.687C62.1008 124.747 62.9587 125.606 64.017 125.606Z",fill:"#C95960"}),o.createElement("path",{d:"M78.8803 151.309C79.9385 151.309 80.7964 150.45 80.7964 149.391C80.7964 148.331 79.9385 147.472 78.8803 147.472C77.822 147.472 76.9641 148.331 76.9641 149.391C76.9641 150.45 77.822 151.309 78.8803 151.309Z",fill:"#C95960"}),o.createElement("path",{d:"M46.728 98.5765V84.9246",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M63.3943 98.5765V84.9246",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M80.0562 98.5765V84.9246",stroke:"#ACC4D7",strokeMiterlimit:"10"}),o.createElement("path",{d:"M96.7224 98.5765V84.9246",stroke:"#ACC4D7",strokeMiterlimit:"10"})),ie=()=>o.createElement(w.ZP,{glyph:te,width:"206px",height:"174px",viewBox:"0 0 206 174"});var oe=i(72120),se=i(48062),ne=i(72015),ae=i(68814);const le=v.ZP.div`
  z-index: 10;
  display: inline-block;
`;le.displayName="AutoScheduleHelpWrapper";const re=(0,$.Ie)(v.ZP.div`
  align-items: center;
  background-color: ${()=>(0,$.u_)((e=>e.colors.lightGrey10))};
  border-bottom: 1px solid ${()=>(0,$.u_)((e=>e.colors.dropdownMenu.border))};
  bottom: ${e=>e.initialOpen?"502px":"512px"};
  color: ${()=>(0,$.u_)((e=>e.colors.darkGrey))};
  display: flex;
  left: ${e=>e.initialOpen?"-110px":"-10px"};
  margin: 0 auto;
  transition: margin 300ms ease;
  width: 280px;
`);re.displayName="AutoScheduleSelector";const de=(0,$.Ie)(v.ZP.div`
  display: inline-block;
  font-weight: ${()=>(0,$.u_)((e=>e.typography.body.weight))};
  font-size: ${()=>(0,$.u_)((e=>e.typography.body.size))};
  padding: ${()=>(0,$.u_)((e=>`${e.spacing.spacing12} ${e.spacing.spacing4} ${e.spacing.spacing12} ${e.spacing.spacing12}`))};
`);de.displayName="AutoScheduleSelectorLabel";const ce=e=>o.createElement(N.zx,{type:N.Wm,height:N.iq,...e}),pe=e=>o.createElement(ce,{...e},o.createElement(w.ZP,{glyph:ne.Z}));pe.displayName="AutoScheduleSelectorHelpIcon";const me=v.ZP.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
`;me.displayName="AutoScheduleSelectorToggle";const he=(0,O.R)((0,v.ZP)(ae.D)``,"AutoScheduleInputToggle");he.displayName="AutoScheduleInputToggle";const ue=(0,$.Ie)(v.ZP.p`
  display: inline-block;
  font-size: ${()=>(0,$.u_)((e=>e.typography.body.size))};
  font-weight: ${()=>(0,$.u_)((e=>e.typography.label.weight))};
  margin: 0 ${()=>(0,$.u_)((e=>e.spacing.spacing4))} 0 0;
`);ue.displayName="AutoSchedulePopoverTitle";const Ee=S.Z._("What is AutoSchedule?"),ge=S.Z._("Hootsuite will choose an optimal time to post, allowing you to easily schedule posts with one click."),De=S.Z._("Learn more"),Se="composerAutoScheduleHelpButton",Te=S.Z._("AutoSchedule"),_e=({visible:e,onDismiss:t})=>o.createElement(se.J2,{boundariesElement:se.m9,isOpen:e,target:`.${Se}`,popTo:se.D,closeOnClickOutside:!0,onExitClick:t},o.createElement(ue,null,Ee),ge," ",o.createElement(oe.A,{href:"https://help.hootsuite.com/hc/en-us/articles/204586040#2",rel:"noopener noreferrer",target:"_blank"},De)),Ce=({isInitialOpen:e,inputLabel:t,onToggleAutoschedule:i,isChecked:s,entitlements:n})=>{const[a,l]=(0,o.useState)(!1),r=e=>{e.stopPropagation(),e.nativeEvent&&e.nativeEvent.stopImmediatePropagation&&e.nativeEvent.stopImmediatePropagation(),l(!a)};return I.I.isFeatureEnabled(n,h.tt)?o.createElement(re,{initialOpen:e},o.createElement(de,null,Te),o.createElement(pe,{"aria-haspopup":"true",className:Se,onClick:r,onKeyPress:e=>{e.key===f.Z.KEY_VALUES.ENTER&&r(e)},role:"button",tabIndex:"0"}),o.createElement(le,null,o.createElement(_e,{visible:a,onDismiss:r})),o.createElement(me,null,o.createElement(he,{label:t,onChange:i,onKeyPress:e=>{e.key===f.Z.KEY_VALUES.ENTER&&"function"==typeof i&&i(e)},checked:s}))):null};var fe=i(3374);const ye=v.ZP.div`
  outline: none;
`,Ae=(0,$.Ie)((0,O.R)(v.ZP.div`
      width: 280px;
      margin: 0 auto;
      background-color: ${()=>(0,$.u_)((e=>e.colors.lightGrey10))};
      font-size: ${()=>(0,$.u_)((e=>e.typography.body.size))};
    `,"SingleDateTimePicker")),Ie=(0,$.Ie)(v.ZP.div`
  display: flex;
  justify-content: center;
  padding: ${()=>(0,$.u_)((e=>`0 ${e.spacing.spacing8} ${e.spacing.spacing8} ${e.spacing.spacing8}`))};
`),Me=(0,$.Ie)((0,O.R)((0,v.ZP)(N.zx).attrs({type:N.Vb})`
      width: 100%;
    `,"SetButton")),be=(0,$.Ie)((0,O.R)((0,v.ZP)(oe.A)`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-bottom: ${()=>(0,$.u_)((e=>e.spacing.spacing16))};

      &:hover {
        text-decoration: underline;
      }
    `,"SetButton")),Ze=e=>e.isAutoscheduled?o.createElement(be,{...e}):o.createElement(Me,{...e}),ke=(0,$.Ie)(v.ZP.div`
  display: block;
  width: 280px;
  height: 450px;
  margin: 0 auto;
  color: ${()=>(0,$.u_)((e=>e.colors.darkGrey))};
  background-color: ${()=>(0,$.u_)((e=>e.colors.lightGrey10))};
  transition: margin 300ms ease;
`),we=(0,$.Ie)(v.ZP.div`
  width: 230px;
  padding: ${()=>(0,$.u_)((e=>e.spacing.spacing24))};
  text-align: center;
`),Ne=(0,$.Ie)(v.ZP.div`
  padding: 0 ${()=>(0,$.u_)((e=>e.spacing.spacing24))};
  font-size: ${()=>(0,$.u_)((e=>e.typography.body.size))};
`),Pe=(0,$.Ie)(v.ZP.div`
  padding: ${()=>(0,$.u_)((e=>e.spacing.spacing24))};
  text-align: center;
`),Le=e=>o.createElement(N.zx,{type:N.Vb,width:"100%",...e}),ve=(0,$.Ie)(v.ZP.div`
  color: ${()=>(0,$.u_)((e=>e.colors.darkGrey80))};
  font-size: ${()=>(0,$.u_)((e=>e.typography.small.size))};
  padding-top: ${()=>(0,$.u_)((e=>e.spacing.spacing8))};
  font-family: ${()=>(0,$.u_)((e=>e.typography.fontFamily.primary))};
  text-align: left;
`),Oe=((0,v.ZP)(fe.Vq)`
  width: 630px;
`,(0,v.ZP)(fe.h4.Title)`
  margin-bottom: 0;
`,v.ZP.div`
  width: 100%;
  text-align: center;
`,(0,$.Ie)(v.ZP.div`
  width: 200px;
  padding: ${()=>(0,$.u_)((e=>e.spacing.spacing24))};
  display: inline-block;
  -webkit-user-drag: none;
  user-select: none;
`),(0,$.Ie)(v.ZP.div`
  text-align: left;
  font-size: ${()=>(0,$.u_)((e=>e.typography.body.size))};
  font-weight: ${()=>(0,$.u_)((e=>e.typography.body.weight))};
  padding-bottom: ${()=>(0,$.u_)((e=>e.spacing.spacing16))};
`),v.ZP.div`
  display: flex;
  flex-direction: row-reverse;
`,(0,$.Ie)(v.ZP.div`
  margin-right: ${e=>e.firstButton?"0":(0,$.u_)((e=>e.spacing.spacing8))};
`),(0,$.Ie)((0,v.ZP)(N.zx).attrs({type:N.zQ})``),(0,$.Ie)((0,v.ZP)(N.zx).attrs({type:N._8})``),(0,$.Ie)(v.ZP.div`
  padding: 0 ${()=>(0,$.u_)((e=>e.spacing.spacing12))};
  background-color: ${()=>(0,$.u_)((e=>e.colors.toast.error.background))};
`));Ze.displayName="SetButton",ke.displayName="AutoScheduleInfo",we.displayName="AutoScheduleInfoImage",Ne.displayName="AutoScheduleInfoText",Pe.displayName="AutoScheduleInfoBtnContainer",ve.displayName="AutoScheduleInfoTimezone";const $e=S.Z._("Done"),Ue=S.Z._("On"),ze=S.Z._("Off"),xe=S.Z._("Adjust Settings"),He=S.Z._("Hootsuite will choose a time for optimal impact based on your autoschedule settings."),Re=S.Z._("Hootsuite will choose a time for optimal impact between %b %s1 %/b and %b %s2 %/b on %b %s3 %/b, up to a maximum of %b %s4 posts per day%/b."),Ve=({timezoneName:e,autoScheduleSettings:t,onAdjustSettings:i,entitlements:s})=>{if(I.I.isFeatureEnabled(s,h.tt)){let s;const n=l().tz(e).format("Z").slice(0,-3),a=`${f.Z.DATE_TIME.GMT}${n} ${e}`;return s="object"==typeof t&&Object.keys(t).length>0?Re.replace("%s1",(0,A.X4)(t.startTime)).replace("%s2",(0,A.X4)(t.endTime)).replace("%s3",(0,A.JV)(t.days)).replace("%s4",t.postsPerDay):He,o.createElement(ke,null,o.createElement(we,null,o.createElement(ie,null)),o.createElement(Ne,null,(0,T.gE)(s)),o.createElement(Pe,null,o.createElement(Le,{onClick:i},xe),o.createElement(ve,null,a)))}return null};class Fe extends o.Component{constructor(e){super(e),this.isKeyDownInDatePicker=e=>e&&e.className&&e.className.includes("DayPicker-Day"),this.onKeyDown=e=>{e.key!==f.Z.KEY_VALUES.ENTER||this.isKeyDownInDatePicker(e.target)||e.stopPropagation()},this.focusSingleDateTimePicker=()=>{this.singleDateTimePickerNode.addEventListener("keydown",this.onKeyDown),D.I.addElement(this.singleDateTimePickerNode),D.I.focus(),D.I.trapFocus()},this.removeSingleDateTimePickerFocus=()=>{this.singleDateTimePickerNode.removeEventListener("keydown",this.onKeyDown),D.I.remove(this.singleDateTimePickerNode)},this.showGetAutoSchedulePopover=()=>{this.setState({isShowGetAutoSchedulePopover:!0}),(0,b.j)(f.Z.GET_AUTO_SCHEDULE_MESSAGE_PAYWALL.TRACKING_ORIGIN,f.Z.GET_AUTO_SCHEDULE_MESSAGE_PAYWALL.TRACKING_ACTION)},this.handleDayClick=(e,t)=>{const i=this.state.selectedTime.period===f.Z.DATE_TIME.PM&&this.state.selectedTime.hour!==f.Z.DATE_TIME.NUM_HOURS_IN_PERIOD?this.state.selectedTime.hour+f.Z.DATE_TIME.NUM_HOURS_IN_PERIOD:this.state.selectedTime.hour,o=l().tz(this.props.timezoneName);o.year(e.getFullYear()).month(e.getMonth()).date(e.getDate()).hour(i).minute(this.state.selectedTime.minute).second(0).millisecond(0),!this.props.enabledDays&&t.disabled||this.setState({selectedDate:o.toDate()},(()=>this.saveCurrentDate(!1)))},this.handleSetButtonClick=()=>{this.props.onClose()},this.saveToLocalStorage=()=>{if(!this.props.isEditMode){const e=this.state.selectedDate;if(localStorage&&this.props.memberId)if(JSON.parse(localStorage.getItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE))){const t=JSON.parse(localStorage.getItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE));t[this.props.memberId]=e,localStorage.setItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE,JSON.stringify(t))}else localStorage.setItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE,JSON.stringify({[this.props.memberId]:e}))}},this.onTimeChange=e=>{this.setState({selectedTime:e,selectedDate:T.ED.formatDateWithTimeAndTimezone(this.state.selectedDate,e,this.props.timezoneName)},(()=>this.saveCurrentDate(!1)))},this.preventAllPropagation=e=>{e.stopPropagation(),e.nativeEvent&&e.nativeEvent.stopImmediatePropagation&&e.nativeEvent.stopImmediatePropagation()},this.onToggleAutoschedule=e=>{const{isAutoscheduled:t}=this.props,i=!t;this.preventAllPropagation(e),this.setState({lastSelectedDate:i?this.state.selectedDate:null,selectedDate:i?null:this.state.lastSelectedDate},(()=>this.saveCurrentDate(i)))},this.handleAutoscheduleSettingsButtonClick=()=>{this.props.showAutoScheduleSettings()},this.handleAutoscheduleDirectButtonClick=e=>{const{isAutoscheduled:t,onClose:i}=this.props;t||this.onToggleAutoschedule(e),i()},this.statusObject=M.Z,this.composerMessageActions=g.Nw;const t=l()().tz(e.timezoneName);let i=t.toDate(),o=y.Z.DEFAULT_TIME;if(d.ZP.isNull(e.defaultSelectedDateTime)){if(e.enabledDays){const o=e.enabledDays.dateFrom,s=e.enabledDays.dateTo;i=l()().isAfter(o)&&l()().isBetween(o,s,"day",[])?t.toDate():o}e.minimumScheduleMinutes&&(o=T.ED.getNextTimeSlot(i,this.props.isVideoMessage))}else e.minimumScheduleMinutes&&(o=this.dateTimeToTimeSlot(e.defaultSelectedDateTime)),i=e.defaultSelectedDateTime;if(!this.props.isEditMode&&d.ZP.isNull(e.defaultSelectedDateTime)){let t,s=o;const n=l()().tz(e.timezoneName).toDate();if(localStorage&&this.props.memberId&&localStorage.getItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE)){t=JSON.parse(localStorage.getItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE))[this.props.memberId],e.minimumScheduleMinutes&&(s=T.ED.getNextTimeSlot(n,this.props.isVideoMessage,!0));let a=!0;if(e.enabledDays){const i=e.enabledDays.dateFrom,o=e.enabledDays.dateTo;l()(t).isBetween(i,o,"day",[])||(a=!1)}const r=T.ED.formatDateWithTimeAndTimezone(n,s,e.timezoneName);t&&e.timezoneName&&l()(t).isAfter(r)&&a?(i=new Date(t),o=this.dateTimeToTimeSlot(i)):(localStorage.removeItem(f.Z.LAST_SCHEDULED_TIME_LOCAL_STORAGE),i=T.ED.formatDateWithTimeAndTimezone(i,s,e.timezoneName),o=s)}else i=T.ED.formatDateWithTimeAndTimezone(i,o,e.timezoneName);e.onSetDateTime(i,e.isAutoscheduled)}this.state={selectedDate:i,selectedTime:o,isShowGetAutoSchedulePopover:!1}}componentDidMount(){this.props.isSchedulerOpen&&this.singleDateTimePickerNode&&this.focusSingleDateTimePicker()}componentWillUnmount(){this.props.isSchedulerOpen&&this.removeSingleDateTimePickerFocus()}UNSAFE_componentWillReceiveProps(e){this.singleDateTimePickerNode&&(!this.props.isSchedulerOpen&&e.isSchedulerOpen?this.focusSingleDateTimePicker():this.props.isSchedulerOpen&&!e.isSchedulerOpen&&this.removeSingleDateTimePickerFocus())}dateTimeToTimeSlot(e){const t=l()(e).tz(this.props.timezoneName);return{hour:t.hour()%f.Z.DATE_TIME.NUM_HOURS_IN_PERIOD||f.Z.DATE_TIME.NUM_HOURS_IN_PERIOD,minute:Math.ceil(parseInt(t.minute())/y.Z.SCHEDULE_INTERVAL_MINUTES)*y.Z.SCHEDULE_INTERVAL_MINUTES||0,period:t.hour()>=f.Z.DATE_TIME.NUM_HOURS_IN_PERIOD?f.Z.DATE_TIME.PM:f.Z.DATE_TIME.AM}}saveCurrentDate(e){this.saveToLocalStorage(),this.props.onSetDateTime(this.state.selectedDate,e)}getFirstDayOfWeekFromLocalStorage(){const{timezoneName:e}=this.props,t=(0,u.U)("pnc_preferences_first_day_of_week_filter",null);return null===t?this.isNorthAmericaTimezone(e)?"SUNDAY":"MONDAY":t}isNorthAmericaTimezone(e){const t=l()().tz(e).utcOffset()/60;return t>-11&&t<-1||t>=8&&t<=12}renderCalendar(){const{enabledDays:e,timezoneName:t}=this.props,i=l().tz(t),s=l()(this.state.selectedDate).tz(t);let n={};if(e){const o=e.dateFrom;if(l()(o).isBefore(i,"day")){const e=l().tz(t);e.date(i.date()-1),n={excluded:{from:o,to:e.toDate()}}}}const a=new Date(s.year(),s.month(),s.date(),s.hour(),s.minute(),0,0),r=this.getFirstDayOfWeekFromLocalStorage();return o.createElement(c.Z,{timezoneName:t,weekStartDay:r,fromMonth:l().tz(t).toDate(),enabledDays:e||!1,modifiers:n,onClick:this.handleDayClick,selectedDays:a})}renderTimeRangeSelector(){const{timezoneName:e}=this.props,t=l().tz(e).format("Z").slice(0,-3),i=`${f.Z.DATE_TIME.GMT}${t} ${e}`;return o.createElement("div",null,o.createElement(ee,{onTimeChange:this.onTimeChange,selectedTime:this.state.selectedTime,timeFromGMT:i}))}renderErrors(){const{selectedMessageForEdit:e,showOnSubmitErrors:t,entitlements:i}=this.props,s=e&&e.hasVideoAttachment(!0),n=Z.ZP.isVideoTranscodeable(I.I.isFeatureEnabled(i,h.Fl),e.fieldValidations,(()=>e.hasAttachments(!0))),a=o.createElement(E.jl,{fieldValidations:e.fieldValidations,showOnSubmitErrors:t,field:_.rz.SEND_DATE,type:_.Z9.SEND_DATE,isBulkComposer:!1,errorProps:{minimumScheduleMinutes:e.hasVideoAttachment(!0)?C.Z.MINIMUM_SCHEDULE_MINUTES.VIDEO:C.Z.MINIMUM_SCHEDULE_MINUTES.DEFAULT,hasVideo:s,isTranscodeableVideo:n,shouldHideTitle:!0}});return this.hasSendDateErrors()?o.createElement(Oe,null,a):null}hasSendDateErrors(){return n()(this.props.selectedMessageForEdit,["fieldValidations","errors",_.rz.SEND_DATE],!1)}render(){const{isAutoscheduled:e,autoScheduleSettings:t,isBulkComposer:i,isInitialOpen:s,timezoneName:n,entitlements:a}=this.props,l=I.I.isFeatureEnabled(a,h.tt);return o.createElement(ye,{ref:e=>{this.singleDateTimePickerNode=e},tabIndex:"-1"},!i&&l&&o.createElement(Ce,{isInitialOpen:s,inputLabel:e?Ue:ze,onToggleAutoschedule:this.onToggleAutoschedule,isChecked:e,entitlements:a,showGetAutoSchedulePopover:this.showGetAutoSchedulePopover}),o.createElement(Ae,null,o.createElement("div",{className:e?"hidden":""},this.renderErrors(),this.renderCalendar(),this.renderTimeRangeSelector()),o.createElement("div",{className:e?"":"hidden"},o.createElement(Ve,{timezoneName:n,autoScheduleSettings:t,onAdjustSettings:this.handleAutoscheduleSettingsButtonClick,entitlements:a})),o.createElement(Ie,null,o.createElement(Ze,{onClick:this.handleSetButtonClick,isAutoscheduled:e},$e))))}}Fe.displayName="SingleDateTimePicker",Fe.defaultProps={autoScheduleSettings:{},errors:[],isAutoscheduled:!1,isBulkComposer:!1,isEditMode:!1,isInitialOpen:!1,isSchedulerOpen:!1,isVideoMessage:!1,memberId:null,selectedMessageForEdit:null,showOnSubmitErrors:!1};const Be=(0,p.q)((0,r.$j)((({composer:e,validation:t})=>({isSchedulerOpen:e.isSchedulerOpen,showOnSubmitErrors:t.showOnSubmitErrors}))),(0,m.$j)(g.h,(e=>({selectedMessageForEdit:(0,g.J1)(e)}))))(Fe)}}]);
//# sourceMappingURL=850.bundle.js.map