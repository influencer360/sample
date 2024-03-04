import _ from 'underscore';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
darklaunch.setFeatures(hs.features);

//TODO: clean up the hs namespace extension to only non-private functions
_.extend(hs, darklaunch);

export default darklaunch;

