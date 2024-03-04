import * as FullStory from '@fullstory/browser';

const FS_ORG_ID = 'o-1A0H2C-na1'

const init = ({devMode, userId}={}) => {
  FullStory.init({ orgId: FS_ORG_ID, devMode, debug: false, namespace:'fs_hs'});
  FullStory.identify(userId);

}

export { init }
