import _ from 'underscore';
import FacebookConnector from 'core/social-network/connectors/facebook';
import LinkedinConnector from 'core/social-network/connectors/linkedin';
import TwitterConnector from 'core/social-network/connectors/twitter';
import InstagramConnector from 'core/social-network/connectors/instagram';
import InstagramBusinessConnector from 'core/social-network/connectors/instagrambusiness';
import YoutubeConnector from 'core/social-network/connectors/youtube';
import PinterestConnector from 'core/social-network/connectors/pinterest';
import TikTokBusinessConnector from 'core/social-network/connectors/tiktokbusiness';
import WhatsappConnector from 'core/social-network/connectors/whatsapp';
import ThreadsConnector from 'core/social-network/connectors/threads';

var connectors = {
    'FACEBOOK': FacebookConnector,
    'LINKEDIN': LinkedinConnector,
    'TWITTER': TwitterConnector,
    'INSTAGRAM': InstagramConnector,
    'INSTAGRAMBUSINESS': InstagramBusinessConnector,
    'YOUTUBECHANNEL': YoutubeConnector,
    'PINTEREST': PinterestConnector,
    'TIKTOKBUSINESS': TikTokBusinessConnector,
    'WHATSAPP': WhatsappConnector,
    'THREADS': ThreadsConnector,
};

_.each(connectors, function (ConnectorClass, type) {
    ConnectorClass.prototype.type = type;
});

export default connectors;
