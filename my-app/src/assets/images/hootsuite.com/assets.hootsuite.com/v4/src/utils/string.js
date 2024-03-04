import _ from 'underscore';
import translation from 'utils/translation';
import { types as SocialNetworkTypes } from 'hs-nest/lib/constants/social-networks';
import Util from 'utils/util';
import twitterText from 'twitter-text';

export const urlRegex = /(https?:\/\/([\w\d_\-=/|+#~%]|[.,:?!](?!\s|$|[.,:?!]+)|(&amp;|&(?!amp;))(?!\s|$))+)/ig;
export const httpRegex = /^https?:\/\//i;
export const LINK_TEMPLATE = "<a href='$1' target='_blank' rel='nofollow'>$2</a>";

/** turns & into &amp; */
export function unescapeAmpersand(str) {
    // any escaped HTML from php will contain ampersand, and may be further encoded into &amp;, which will break when we render the HTML
    return str.replace(/&amp;/g, "&");
}

/** turns < and > into &lt; %gt; */
export function unescapeAngleBrackets(str) {
    return str.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/** unescapes html entities of: &, ", ' */
export function unescapeAll(str) {
    return str.toString().replace(/&amp;/g, '&')
        //.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}

export function formatTweetText(str, hidePreview, snType) {
    str = clean(str);
    str = makeUrlClickable(str, !hidePreview);
    str = makeNonHttpUrlClickable(str);
    str = makeUsernameClickable(str, snType);
    str = makeHashClickable(str);
    str = unescapeAmpersand(str);
    return str;
}

export function makeNonHttpUrlClickable(str) {
    if (typeof str !== 'string') {
        return '';
    }

    var urls = twitterText.extractUrlsWithIndices(str).filter(function (u) {
        return (u.url.match(httpRegex) === null); // return all URLs that do not start with http
    });

    return _.reduce(urls.reverse(), function (s, u) {
        var link = LINK_TEMPLATE.replace('$2', u.url).replace('$1', 'http://' + u.url);
        return s.slice(0, u.indices[0]) + link + s.slice(u.indices[1]);
    }, str);
}

/** linkifies urls, with the option of adding the preview [+] icon */
export function makeUrlClickable(str) {
    if (typeof str !== 'string') {
        return '';
    }
    var urls = str.match(urlRegex) || [];
    // add a underscore unique so duplicate urls in the array are eliminated
    return _.reduce(_.uniq(urls), function (str, url) {
        var urlRegex = new RegExp('\\b' + url.replace(/\+/g, '\\+').replace(/\?/g, '\\?') + '\\b', 'g');
        // Find the regex url and replace it with a formed html anchor (replace $1 and $2 with the proper url, add a preview plus button if applicable)
        return str.replace(urlRegex, LINK_TEMPLATE.replace(/(\$2|\$1)/g, url));
    }, str);
}

/** linkifies twitter usernames */
export function makeUsernameClickable(str, snType) {
    var reUser = /@([\w\d_]+)/g;
    var clickableUsername = "";
    switch (snType) {
        case SocialNetworkTypes.INSTAGRAM:
        case SocialNetworkTypes.INSTAGRAMBUSINESS:
            reUser = /@([\w\d_.]+)/g;
            clickableUsername = str.replace(reUser, "@<span class='-usernameLink x-instagram'><button class='_userInfoPopup _instagram' title='$1'>$1</button></span>");
            break;
        case SocialNetworkTypes.TWITTER:
            clickableUsername = str.replace(reUser, "@<button class='_userInfoPopup _twitter' title='$1'>$1</button>");
            break;
        default:
            clickableUsername = str; // only twitter and instagram use @ for mentions
            break;
    }
    return clickableUsername;
}

/** linkifies twitter hashtags */
export function makeHashClickable(str) {
    // character class special chars (escpae these): ^-]\
    var reHash = /(\s|^|:|\.|,)(#)([^!@#$%^&*()|\-+=\\[\]"':;,.?<>/\s]+)/g;
    return str.replace(reHash, '$1<button class="_quickSearchPopup hash" title="$3">$2$3</button>');
}


/**
 * Helper function for getting a timestamp from a string or int date
 * @param time
 * @returns - int timestamp or empty string for invalid time
 */
export function getTimestamp(time) {
    var timestamp = 0;
    if (time && !isNaN(time * 1)) {
        timestamp = time * 1;
    } else {
        if (time && typeof time == "string") {
            /* Twitter api 1.1 returning dates in this format:
             * created_at = "29 Jan +0000 22:26:05"
             * so we need to turn this into a friendlier format
             */
            var newDateMatches = time.match(/^(\d{1,2}) (\w\w\w) (\+\d\d\d\d) (\d\d:\d\d:\d\d)/);
            if (newDateMatches) {
                /*
                 * turn it into "Jan 29 22:21:51 2013";
                 */
                time = newDateMatches[2] + ' ' + newDateMatches[1] + ' ' + newDateMatches[4] + ' ' + (new Date()).getFullYear();
            }
            // +0000, the GMT modifier, confuses javascript!
            timestamp = Date.parse(time.replace(/\+0000/, ''));
        } else {
            return '';
        }
    }

    return timestamp;
}

/**
 * Converts a date to our stream display format
 * The date has to be in the following format: 29 Jan +0000 22:26:05
 * Which is the format that Twitter API's returns.
 * @param {String} time Date String
 * @param {Number} [offsetSeconds] Number of seconds to offset by
 * @param {Boolean} [displayTodayPrefix] Display the word "Today" if the date is the current day
 * @example hs.str.formatDate('29 Jan +0000 22:26:05') make sure your date matches this format
 *
 */
export function formatDate(time, offsetSeconds, displayTodayPrefix) {
    if (!offsetSeconds && offsetSeconds !== 0) {
        offsetSeconds = hs.timezoneOffset;      // use global
    }

    var timestamp;
    if (isNaN(time) || time instanceof Date) {
        timestamp = getTimestamp(time);
    } else {
        timestamp = parseInt(time);
    }
    if (timestamp === '') {
        return '';
    }

    var dt = new Date(timestamp + (offsetSeconds * 1000));
    var hours = dt.getHours();
    var amPm = "am";
    if (hours > 11) {
        amPm = "pm";
        hours = hours - 12;
    }
    if (hours === 0) {
        hours = 12;
    }
    var minutes = dt.getMinutes();
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    var timeString = hours + ":" + minutes + amPm;
    var datePieces = dt.toDateString().split(" ");
    // + ", " + datePieces[3];      // comment out the year for now
    var dateString = datePieces[1] + " " + datePieces[2];
    // see if timestamp is within today
    var now = new Date(),
        isSameDay = false,
        isSameYear = true;
    // now = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    now = now.getTime();
    if (now - timestamp < 24 * 60 * 60 * 1000) {
        var nowDate = new Date(now + (offsetSeconds * 1000));
        if (nowDate.getDate() === dt.getDate()) {
            isSameDay = true;
        }
    }
    if (new Date().getFullYear() != parseInt(datePieces[3], 10)) {
        isSameYear = false;
    }
    if (isSameDay) {
        return (displayTodayPrefix ? translation._("Today ") : '') + timeString;
    } else {
        var result = dateString + ', ' + timeString;
        if (!isSameYear) {
            result = dateString + ', ' + datePieces[3] + ', ' + timeString;
        }
        return result;
    }
}

/**
 * Some constants for our relative date format
 */
var msPerMinute = 60 * 1000,
    msPerHour = msPerMinute * 60,
    msPerDay = msPerHour * 24,
    msPerMonth = msPerDay * 30,
    msPerYear = msPerMonth * 365;

/**
 * Converts a date to a relative string format for mobile streams
 * @param previous - the date to compare
 * @param current (optional) - the date to be relative to. If not passed in, uses now
 * @returns {string} - The relative formatted date
 */
export function formatDateRelative(previous, current) {
    var elapsed;

    if (previous && typeof previous == "string") {
        if (isNaN(previous)) {
            // create our previous timestamp relative to UTC +0000
            previous = new Date(previous.replace('+0000', '') + ' +0000');
        }
    } else {
        // invalid previous date
        return '';
    }

    // if no current, use now
    if (!current) {
        current = new Date();
    } else if (typeof current == "string") {
        current = new Date(current.replace('+0000', '') + ' +0000');
    } else {
        // invalid current date
        return '';
    }

    // calc difference in ms
    elapsed = current - previous;
    if (elapsed < 0) {
        elapsed = 0; // we don't want to show negative times to the user
    }

    if (elapsed < msPerMinute) {
        elapsed = Math.round(elapsed / 1000);
        if (elapsed === 1) {
            return translation._("%d second").replace('%d', elapsed);
        } else {
            return translation._("%d seconds").replace('%d', elapsed);
        }
    }
    else if (elapsed < msPerHour) {
        elapsed = Math.round(elapsed / msPerMinute);
        if (elapsed === 1) {
            return translation._("%d minute").replace('%d', elapsed);
        } else {
            return translation._("%d minutes").replace('%d', elapsed);
        }
    }
    else if (elapsed < msPerDay) {
        elapsed = Math.round(elapsed / msPerHour);
        if (elapsed === 1) {
            return translation._("%d hour").replace('%d', elapsed);
        } else {
            return translation._("%d hours").replace('%d', elapsed);
        }
    }
    else if (elapsed < msPerMonth) {
        elapsed = Math.round(elapsed / msPerDay);
        if (elapsed === 1) {
            return translation._("%d day").replace('%d', elapsed);
        } else {
            return translation._("%d days").replace('%d', elapsed);
        }
    }
    else if (elapsed < msPerYear) {
        elapsed = Math.round(elapsed / msPerMonth);
        if (elapsed === 1) {
            return translation._("%d month").replace('%d', elapsed);
        } else {
            return translation._("%d months").replace('%d', elapsed);
        }
    }
    else {
        elapsed = Math.round(elapsed / msPerYear);
        if (elapsed === 1) {
            return translation._("%d year").replace('%d', elapsed);
        } else {
            return translation._("%d years").replace('%d', elapsed);
        }
    }
}

export function relativeTimeInWords(timestamp, now) {
    var elapsed = Math.abs(now - timestamp),
        prefix = '';

    if (now < timestamp) {
        prefix = 'in ';
    }

    switch (true) {
        case elapsed < 45:
            return translation._('just now');
        case elapsed < 90:
            return translation._(prefix + '1 min');
        case elapsed < 2700:
            return translation._(prefix + '%d mins').replace('%d', Math.round(elapsed / 60));
        case elapsed < 5400:
            return translation._(prefix + '1 hour');
        case elapsed < 79200:
            return translation._(prefix + '%d hours').replace('%d', Math.round(elapsed / 60 / 60));
        case elapsed < 129600:
            return translation._(prefix + '1 day');
        // if (prefix) return translation._('tomorrow');
        // else return translation._('yesterday');
        case elapsed < 604800:
            return translation._(prefix + '%d days').replace('%d', Math.round(elapsed / 60 / 60 / 24));
    }
}

/**
 * Format Date With Offset
 * @param {string} time
 * @param {boolean} displayTodayPrefix
 * @returns {*}
 */
export function formatDateWithOffset(time, displayTodayPrefix) {
    return formatDate(time, (new Date()).getTimezoneOffset() * 60 + hs.timezoneOffset, displayTodayPrefix);
}

/**
 *  Turns new lines to < br >
 *  @param {string} str string to process
 */
export function nl2br(str) {
    return str.replace(/(\r)?\n/g, '<br />');
}

/**
 * Converts an ISO8601 date to date.parse friendly format
 * ISO8601 date format: 2013-08-18T14:29:30 or 2013-08-18 14:29:30
 * Output format: Aug 18, 2013 14:29:30
 * @param {String} str Date String
 * @example You can use this function to format a date to be compatble to our stream format
 * hs.str.formatDate(hs.str.formatISO8601Date('2013-08-18 14:29:30')) The result will be Aug 18, 7:29 am
 * (converts to UTC timezone)
 */
export function formatISO8601Date(str) {
    if (!str) {
        return '';
    }
    /*
     * given dates in this format:
     * 2010-01-14T19:14:03Z
     * we want to turn that to
     * 2010 01 14 19:14:03
     */
    var dateStr = str.replace(/[T-]|((\.\d+)?Z)/ig, ' ');
    var arrDate = dateStr.split(' ');
    // now turn month into short string...this is only needed for safari
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        monthNum = arrDate[1] * 1 - 1,
        monthName = monthNames[monthNum] || "";
    // final format will be Jan 14, 2010 19:14:03 (Safari Date.parse() likes this better)
    return monthName + " " + arrDate[2] + ", " + arrDate[0] + " " + arrDate[3];
}

/**
 * Clean String
 * @param {string} s String to clean
 * @param {string} [cleanType='html'] clean type, may be html or url
 * @returns {string}
 */
export function clean(s, cleanType) {
    if (!s) {
        return '';
    }
    var ret;

    cleanType = cleanType || 'html';

    s = s.toString();
    switch (cleanType) {
        case 'html':
            ret = s.replace(/\s&\s/g, ' &amp; ').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\\/g, '&#92;');
            break;
        case 'url':
            ret = encodeURIComponent(s);
            break;
        default:
            ret = s;
            break;
    }
    return ret;
}

/**
 *
 * @param {int} x
 * @param {string} decimalType : either "." or ","
 * @param {string} separatorType : if not passed as param, default value set other than the decimalType
 * @returns {string}
 */
export function formatNumber(x, decimalType, separatorType) {
    if (decimalType !== ',') {
        decimalType = '.';
    }
    if (typeof separatorType === 'undefined') {
        separatorType = (decimalType === '.') ? ',' : '.';
    }
    var sep = {
        decimal: decimalType,
        thousands: separatorType
    };
    var parts = x.toString().split(sep.decimal);
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep.thousands);
    return parts.join(sep.decimal);
}

export function getSocialNetworkNameByType(type) {
    var ret = Util.ucFirst(type.toLowerCase());
    switch (type.toUpperCase()) {
        case 'FACEBOOKPAGE':
            ret = 'Facebook Page';
            break;
        case 'FACEBOOKGROUP':
            ret = 'Facebook Group';
            break;
        case 'FACEBOOKADACCOUNT':
            ret = 'Facebook Ad Account';
            break;
        case 'LINKEDIN':
            ret = 'LinkedIn';
            break;
        case 'LINKEDINCOMPANY':
            ret = 'LinkedIn Company';
            break;
        case 'LINKEDINADACCOUNT':
            ret = 'LinkedIn Ad Account';
            break;
        case 'INSTAGRAM':
            ret = 'Instagram Personal';
            break;
        case 'INSTAGRAMBUSINESS':
            ret = 'Instagram Business';
            break;
        case 'YOUTUBE':
            ret = 'YouTube';
            break;
        case 'YOUTUBECHANNEL':
            ret = 'YouTube Channel';
            break;
        case 'PINTEREST':
            ret = 'Pinterest';
            break;
        case 'TIKTOKBUSINESS':
            ret = 'TikTok Business';
            break;
        case 'WHATSAPP':
            ret = 'WhatsApp';
            break;
        case 'INAPPCHAT':
            ret = 'Hootsuite Support Chat';
            break;
        case 'GENERIC':
            ret = 'Generic';
            break;
        default:
            break;
    }
    return ret;
}

/**
 * Fixes discrepancies in entity indices caused by emojis
 */
export function fixEmojiIndices(tweetText, tweetEntity, entityIndex) {
    var indexOffset = 0;
    var hasEmojis = tweetText.match(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDFFF])/g);
    if (hasEmojis && hasEmojis.length > 0) {

        // multibyte character handling for emojis.
        var emojiPos = [];
        var pos;
        var emojisBeforePos = 0;
        _.each(hasEmojis, function (value) {
            pos = tweetText.indexOf(value, emojiPos[emojiPos.length - 1] + 2);
            emojiPos.push(pos);
        });
        var emojisBefore = _.filter(emojiPos, function (position) {
            emojisBeforePos++;
            return position <= tweetEntity.indices[0] + emojisBeforePos;
        });

        if (tweetText && tweetText.substring(0, 4).toLowerCase() !== 'rt @') {
            if (emojisBefore.length > 0) {
                indexOffset = -emojisBefore.length;
            } else {
                indexOffset = (entityIndex > 0) ? -emojisBefore.length : 0;
            }
        } else {
            if (emojisBefore.length > 0) {
                indexOffset = -emojisBefore.length;
            } else {
                indexOffset = (entityIndex > 0) ? -hasEmojis.length : 0;
            }
        }
    }
    return indexOffset;
}

/**
 * Returns true if the haystack ends with the needle.
 *
 * @param {string} haystack
 * @param {string} needle
 * @returns {boolean}
 */
export function endsWith(haystack, needle) {
    var index = haystack.lastIndexOf(needle);
    return index > -1 && index === haystack.length - needle.length;
}

