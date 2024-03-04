import defaultConfig from './default-config'
import multiInstagramNetwork from './multi-instagram-profile'
import multiNetwork from './multi-network'
import singleNetwork from './single-instagram-profile'

export default ({ selectedInstagramProfiles, isNonIGNetworkSelected, postType }) =>
  [
    multiNetwork({ selectedInstagramProfiles, isNonIGNetworkSelected, postType }),
    multiInstagramNetwork({
      selectedInstagramProfiles,
      isNonIGNetworkSelected,
      postType,
    }),
    singleNetwork({
      selectedInstagramProfiles,
      isNonIGNetworkSelected,
      postType,
    }),
  ].reduce((config, step) => step(config), defaultConfig())
