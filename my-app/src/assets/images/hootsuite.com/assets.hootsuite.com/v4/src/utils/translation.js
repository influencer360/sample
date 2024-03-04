import _ from 'underscore';
import translation from 'hs-nest/lib/utils/translation';

if (hs.prefs.language === "" && hs.language !== "") {
    hs.prefs.language = hs.language;
}
if (hs.prefs && hs.prefs.language && hs.languagePack) {
    translation.set(hs.prefs.language, hs.languagePack);
}

translation.c = {};
/** * @memberOf translation.c */
translation.c.LOADING = translation._("Loading...");
/** * @memberOf translation.c */
translation.c.SAVING = translation._("Saving...");
/** * @memberOf translation.c */
translation.c.ERROR_GENERIC = translation._("An error occurred, please try again");
/** * @memberOf translation.c */
translation.c.MONTH_NAMES = [translation._("January"), translation._("February"), translation._("March"), translation._("April"), translation._("May"), translation._("June"), translation._("July"), translation._("August"), translation._("September"), translation._("October"), translation._("November"), translation._("December")];
/** * @memberOf translation.c */
translation.c.MONTH_NAMES_SHORT = [translation._("Jan"), translation._("Feb"), translation._("Mar"), translation._("Apr"), translation._("May"), translation._("Jun"), translation._("Jul"), translation._("Aug"), translation._("Sep"), translation._("Oct"), translation._("Nov"), translation._("Dec")];
/** * @memberOf translation.c */
translation.c.DAY_NAMES = [translation._("Sunday"), translation._("Monday"), translation._("Tuesday"), translation._("Wednesday"), translation._("Thursday"), translation._("Friday"), translation._("Saturday")];
/** * @memberOf translation.c */
translation.c.DAY_NAMES_SHORT = [translation._("Sun"), translation._("Mon"), translation._("Tue"), translation._("Wed"), translation._("Thu"), translation._("Fri"), translation._("Sat")];
/** * @memberOf translation.c */
translation.c.NUM_LIKES_CODE = translation._("%s%s%d%s likes%s");
/** * @memberOf translation.c */
translation.c.NUM_PLUSONES_CODE = translation._("%s%s+%d%s%s");
/** * @memberOf translation.c */
translation.c.NUM_REPOSTS_CODE = translation._("%s%s%d%s reposts%s");
/** * @memberOf translation.c */
translation.c.NUM_SHARES_CODE = translation._("%s%s%d%s shares%s");
/** * @memberOf translation.c */
translation.c.PERMISSION_CUSTOM = translation._("Custom");
/** * @memberOf translation.c */
translation.c.PERMISSION_DEFAULT = translation._("Default");
/** * @memberOf translation.c */
translation.c.PERMISSION_NO_PERMISSIONS = translation._("No Permissions");

// translation for external apps
translation._("Scraps");
translation._("My Activities");
translation._("Communities");

// translation for customerpermission.ejs
translation._("View / Add / Delete members within this organization");
translation._("View / Add / Edit / Delete teams within this organization");
translation._("View / Add / Edit / Delete social networks within this organization");
translation._("Set organization permissions for all members");
translation._("Edit organization name, avatar and Social Organization setting");
translation._("Add / Edit / Delete vanity URLs");
translation._("Add / Edit / Delete twitter archives");
translation._("Member's messages require approval for publication");
translation._("Publish a message to this social network");
translation._("Approve messages for publication");
translation._("Edit social network name, avatar and Secure Post setting");
translation._("Set social network permissions for all members");
translation._("Add / Remove members on this team");
translation._("Edit team name, avatar and vanity URL access");
translation._("Add / Remove social networks");
translation._("Add / Remove team access to an organization vanity url");
translation._("Manage team message templates");
translation._("Set team permissions for all members");

// HS-3467
translation._("slide to send message");
translation._("My Organization");
translation._("Comment");
translation._("Archive Info");
translation._("Show help tips");
translation._("This social network needs to be re-authenticated");
translation._("Compact");
translation._("Tile");

// TOOL-199
translation._("View Teams");
translation._("View Social Networks");
translation._("Organizations that I'm a part of:");

// YouTube compose box
translation._("YouTube Video Upload");
translation._("Category");
translation._("Privacy");
translation._("Schedule to go Public");
translation._("By clicking 'Publish' or 'Schedule', you certify that you own all rights to the content or that you are authorized by the owner to make the content publicly available on YouTube, and that it otherwise complies with the YouTube Terms of Service located at");
translation._("Video Thumbnail");
translation._("Publish Now");
translation._("Uploading video - ");
translation._("Upload complete!");
translation._("Your Video Has Been Published!");
translation._("Your Video Has Been Scheduled!");
translation._("Your Video Has Been Updated!");
translation._("Embed Code");
translation._("Video URL");
translation._("Share via Hootsuite");
translation._("Confirm Publish");
translation._("By clicking continue, the video you have selected will be uploaded to your YouTube channel immediately. Clicking continue will prevent this dialogue from showing again.");
translation._("Schedule Video Privacy");
translation._("Schedule \"Private\" or \"Unlisted\" videos to go live at a later date, or choose \"Public\" to have your video publish immediately.");
translation._("Ok, Got it!");
translation._("Add tags (eg. owls, social media, hipsters, etc.)");
translation._("Remove Scheduled Event");
translation._("Remove event only");
translation._("Remove event and delete video");
translation._("The scheduled event will be removed and your video will be permanently deleted from YouTube. This can not be undone.");
translation._("Remove Event");
translation._("Remove and Delete Video");
translation._("Are you sure you want to remove the scheduled event to set \"%s1\" from %s2 to %s3 on %s4?");
translation._("The scheduled event will be removed but the video will remain on YouTube in the %s1 state.");
translation._("Connect your YouTube channel to upload new videos and easily share them to your social networks.");
translation._("Connect to YouTube");
translation._('%s1 GB');
translation._('%s1 MB');
translation._('%s1 KB');
translation._('%s1 byte');
translation._('%s1 bytes');
translation._('Invalid aspect ratio.');
translation._('Aspect Ratio is %s1, YouTube recommends an aspect ratio of 4:3 or 16:9.');
translation._('This video is too large to be archived (%s1); maximum size is %s2');
translation._('This video is too large (%s1); maximum size is %s2');
translation._('Video length is %s1, YouTube allows at most %s2.');
translation._('Video length is %s1, YouTube allows at most %s2 for unverified accounts.');
translation._('We can\'t recognize the audio format for this file. See %s1YouTube\'s recommended upload settings%s2.');
translation._('Video codec is %s1, YouTube recommends %s2.');
translation._('Video mimetype is %s1, Hootsuite supports video/m4v, video/mp4 or video/x-m4v.');
translation._('Set');

// PUB-3699
translation._('Selected event deleted');
translation._('Selected event and video deleted');
translation._('Selected messages and events deleted');
translation._('Selected messages and videos deleted');
translation._('Remove event only');
translation._('Remove events only');
translation._('Remove event and delete video');
translation._('Remove events and delete videos');
translation._('Remove Scheduled Events'),
translation._('Are you sure you want to remove the scheduled events for %s1 YouTube videos?');
translation._('The scheduled events will be removed but the video will remain on YouTube in their current privacy state.');
translation._('The scheduled events will be removed and your videos will be permanently deleted from YouTube. This can not be undone.');
translation._('Delete Selected Items');
translation._('You have selected %s1 items to be deleted. How would you like to handle the YouTube events?');
translation._('The scheduled events will be removed but the videos will remain on YouTube in their current privacy state.');
translation._('Confirm');

// PUB-3775
translation._('Are you sure you want to delete %s1 selected items?');
translation._('1 YouTube Video');
translation._('%s1 YouTube Videos');

// PUB-3712
translation._('Failed to publish to YouTube');
translation._('Invalid description');
translation._('Invalid tags');
translation._('Invalid title');

// TOOL-1129
translation._('An unknown error occurred creating this tag. Please try again later.');
translation._('Active Tags');
translation._('Tag Name: A-Z');
translation._('Cannot update tag name: a tag by that name already exists.');
translation._('Cannot create tag; a tag with this name already exists.');
translation._('Cannot create tags listed above; please check if the tag name already exists as an active or archived tag.');
translation._('Please remove all duplicate tags before creation.');
translation._('There was an error creating the tags.');
translation._('There was an error updating this tag.');
translation._('There was an error creating this tag.');
translation._('Tag name is too long: tags can be no longer than %s characters.');
translation._('Tag description is too long: tags can be no longer than %s characters.');
translation._('Tag name cannot be empty.');
translation._('Tag successfully created.');
translation._(' tags successfully created.');
translation._('Tag successfully archived.');
translation._('Tag successfully restored.');
translation._('Tag successfully deleted.');
translation._('Archived');
translation._('Active');
translation._('Archive');
translation._('Delete');
translation._('Unarchive');
translation._('Cancel');
translation._('Create tags (%s)');
translation._('Create a list of tags to make available to your organization below');
translation._('No results found');
translation._("Try adjusting your search filters to find what you're looking for");
translation._('Search');
translation._('ARCHIVED');
translation._('Archive Selected');
translation._('Restore Selected');
translation._('Active Tags');
translation._('Archived Tags');
translation._('All Tags');
translation._('Tag Name: Z-A');
translation._('Date Modified: Newest');
translation._('Date Modified: Oldest');
translation._('Create New Tag');
translation._('%s Tags Selected');
translation._('Are you sure you want to delete this tag? This action cannot be undone. All data related to this tag will be lost.');
translation._('Delete Tag');
translation._("You haven't set up any tags yet!");
translation._('You can add tags to messages in Hootsuite to help you:');
translation._('measure and analyze types of incoming messages');
translation._('track the success of your published campaigns');
translation._("measure your team's response times to customer enquiries");
translation._('Set Up Tags');
translation._(' tag was successfully created');
translation._(' tags were successfully created');
translation._('. We could not create the following ');
translation._(', but we could not create the following ');
translation._('tag:');
translation._(' tags:');
translation._('Edit These Tags');
translation._('OK, Close');
translation._('Some tags could not be created');
translation._('Please check if the tag name already exists as an active or archived tag.');
translation._('Batch Create');
translation._('Cancel');
translation._('Details');
translation._('Manage Tags');
translation._('Create Tags');
translation._('Create');
translation._('Tag Description');
translation._('Describe the tag');
translation._('Create New Tag');
translation._('Tag Name');
translation._('Choose a tag name');
translation._('Created');
translation._('Modified');
translation._('Find tags');
translation._('Tags');
translation._('Content flagged by Instagram');

window.translation = window.translation || {};
_.extend(window.translation, translation);

export default translation;

