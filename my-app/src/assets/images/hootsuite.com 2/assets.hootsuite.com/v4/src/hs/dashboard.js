/**
 * @parent base
 */
import '3rd/jquery.daterangepicker';
import 'fe-vendor-dateformat';
import 'fe-vendor-plupload';
import 'fe-styled-components';
import 'react';
import 'appdirectory/appdirectory';
import 'address';
import 'billing';
import 'in_jsapi';
import 'appapi';
import 'member';
import 'message_box';
import 'messageboxprofileselector';
import 'multiselector';
import 'owly';
import 'plans';
import 'profileselector';
import 'resize';
import 'teamselector';
import 'publisher/message_template';
import 'stream/box';
import 'stream/facebook';
import 'stream/instagram';
import 'stream/search';
import 'stream/stream';
import 'stream/twitter';
import 'utils/bubble_popup';
import 'utils/dropdown/jquery.hsdropdown';
import 'utils/popauth';
import 'utils/tagselector';
import 'utils/tooltip';
import { bootFunctions } from 'dashboard/boot';
import { boot, setupBoot } from 'core/boot';
import { startTestBox } from '@testboxlab/browser';

startTestBox({
    allowFullStory: true
})
setupBoot(bootFunctions)
boot()
