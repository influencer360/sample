import 'utils/darklaunch';

export default {
    init: function () {
        //define all constants
        hs.c.userInactivityTimeout = 60 * 60 * 1000;
        hs.c.ajaxTimeout = 30 * 1000;
        hs.c.delayPrefsTab = 2; //secs
        hs.c.delayPrefsMember = 1; //secs
        hs.c.delayResizeView = 100; //milliseconds
        hs.c.delayUpdateTitleAlert = 2; //secs

        hs.c.minColumnSize = 320; //px
        hs.c.maxColumnSize = 600; //px

        hs.c.currentStreamSize = 'standard';
        hs.c.streamSizes = {
            compact: {
                minColumnSize: hs.isFeatureEnabled('GLOB_1157_STREAM_SIZING') ? 240 : 300, //px
                maxColumnSize: 600 //px
            },
            standard: {
                minColumnSize: hs.isFeatureEnabled('GLOB_1157_STREAM_SIZING') ? 280 : 320, //px
                maxColumnSize: 600 //px
            },
            comfortable: {
                minColumnSize: 412, //px
                maxColumnSize: 620 //px
            }
        };

        hs.c.slimColumnSize = 250;
        hs.c.columnSpacing = 4; //px
        hs.c.moreColumnsSpacing = hs.isFeatureEnabled('NGE_16987_COLUMN_SLIDERS') ? 45 : 0;
        hs.c.maxTabColumns = 10;
        hs.c.maxColumnTweets = 30; //maximum number of tweets a column can have and to maintain (unless user clicks on more) // used to be 100
        hs.c.maxTweetMsgLength = 280;
        hs.c.maxTwitterDirectMessageLength = 10000;
        hs.c.twitterDirectMessageRegex = /^(\s*)?[Dd][Mm]?\s@?[\d\w]*\s/;
        hs.c.maxFbMsgLength = 2000;
        hs.c.maxLinkedInMsgLength = 3000;
        hs.c.maxInstagramMsgLength = 2200;
        hs.c.maxUploadFileSize = 10000000;	// 10mb

        hs.c.twitterUrlLength = 23;
        hs.c.picTwitterUrlLength = 24;

        hs.c.owlyImageUrlLength = 20;

        hs.c.pingServerInterval = 1000 * 60 * 10; // 10 minutes !!!IMPORTANT. If this value changes, then Census needs to be updated too.

        hs.c.numViewableCols = 3;
        hs.c.currentColWidth = 320;
        hs.c.colWidthPercent = 1;
    }
};
