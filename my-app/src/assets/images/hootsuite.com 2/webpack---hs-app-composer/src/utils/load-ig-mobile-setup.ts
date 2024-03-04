export const importInstagramMobileSetup = async instagramProfileId => {
  const { showInstagramMobileSetupModal } = await import(
    /* webpackChunkName: "showInstagramMobileSetupModal" */ 'fe-pnc-comp-instagram-mobile-setup-modal'
  )
  showInstagramMobileSetupModal({ instagramProfileId })
}
