import React from 'react'
import ReactDOM from 'react-dom'
import template from 'lodash/template';
import _ from 'underscore';
import 'utils/util_static';
import Icon from '@fp-icons/icon-base';
import EmblemCamera from '@fp-icons/emblem-camera'
import SymbolAlertTriangle from '@fp-icons/symbol-alert-triangle'
import EmblemImage from '@fp-icons/emblem-image'
import SymbolInfoCircle from '@fp-icons/symbol-info-circle'
import SymbolXLight from '@fp-icons/symbol-x-light'
import EmblemTrash from '@fp-icons/emblem-trash'
import EmblemVideoCamera from '@fp-icons/emblem-camera-video'
import SymbolChatBox from '@fp-icons/symbol-chat-box'
import EmblemSingleCopies from '@fp-icons/emblem-single-copies'
import ActionReply from '@fp-icons/action-reply'

var hsEjs = {};

if (!hs.ejsPackage) {
    hs.ejsPackage = {}
}

/**
 * Get ejs template by relative path.
 *
 * e.g. to load the template located at
 * static/js/internal/templates/appdirectory/profileselectorrow.ejs
 * you would pass as `path`
 * "appdirectory/profileselectorrow"
 *
 * The template is expected to have been loaded beforehand by `loadPackage`
 * during bootstrap (see `static/js/src/dashboard/boot.js`).
 *
 * @param {String} path
 * @return a template object, call the method `.render(dataObject)` to render it
 */
hsEjs.getEjs = function (path) {
    if (!hs.ejsPackage[path]) {
        // To the developer from the future: I'm sorry. I tried to remove it but I had to bring it back.
        // This code synchronously load a single template. It works as fallback in production if the
        // first `getEjs` call happens before the download of the combined templates has finished.
        // Search for LPLAT-1471

        // eslint-disable-next-line no-console
        console.warn('ejs template was not preloaded: ' + path + '. Going to try to load it now')

        var client = new XMLHttpRequest()
        client.open("GET", hs.c.jsTemplateRootUrl + path + '.ejs', false) // third parameter indicates sync xhr. :(
        client.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")
        client.send(null)

        if ((client.status < 200 || client.status >= 300) || (client.status === 0 && client.responseText === '')) {
            throw new Error(''
                + 'Failed to load ejs template: ' + path + '\n'
                + 'hs_ejs.js loadPackage() function may have failed earlier' + '\n' +
                + 'or getEjs was called too soon'
            )
        }

        hs.ejsPackage[path] = client.responseText
    }

    var templateAsText = hs.ejsPackage[path]
    return hsEjs.compileTemplate(templateAsText)
};

hsEjs.compileTemplate = function(templateAsText) {
    return {
        render: function(args) {
            var templ = template(templateAsText)
            // Pass underscore as part of the data by default, as our static hs-ejs-loader does
            return templ(Object.assign({ _: _ }, args || {}))
        }
    }
}

/**
 * Load and cache ejs templates
 */
hsEjs.loadPackage = function () {
    window.fetch(hs.util.rootifyJs('/ejs-package.js')).then(function (response) {

        let responseResult = response;
        if (!response.ok) {
            if(response.status === 404) {
                // eslint-disable-next-line no-console
                console.warn('precompiled EJS templates not found, switching to dynamic loading',response)
                responseResult = null
            }
            else {
                throw new Error('Couldn\'t load ejs templates, response was', response)
            }
        }
        return responseResult ? responseResult.json() : null
    }).then(function (ejsTemplates) {
        // Expected format is { [ejs templates path]: 'ejs template as string' }
        // e.g. { 'appdirectory/profileselectorrow' : '<%= "hello" %>' }
        if (ejsTemplates  === null) {
            return
        }

        hs.ejsPackage = ejsTemplates
    })
};

/**
 * Ejs helper to clean pages
 *
 * @param {String} s String to clean
 * @param {String} [cleanType="html"] escape Type, url or html
 *
 * @returns {String} Clean string
 */
hsEjs.cleanPage = function (s, cleanType) {
    // XXX Same implementation as ./strings.js `clean`, copied here to avoid some nasty circular dependencies
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
};

/**
 * Ejs helper to output an SVG icon
 *
 * @param {String} iconName target icon id
 * @param {Number} [size=20] pixel value
 * @param {String} [fill=#949a9b] hex or 'currentColor'
 * @param {String} [additionalClass] appended to icon class
 *
 * @returns {String}
 */
hsEjs.SVGIcon = function (iconName, size, fill, additionalClass) {
    // default values
    var iconSize = size || 20;
    var iconFill = fill || '#949a9b';
    // concatenate additional classes if any
    var iconClass = 'icon-svg' + ((additionalClass) ? ' ' + additionalClass : '');

    const obsoleteHsNestIconsToFeGlobalGlyphs = {
        'fa-camera': EmblemCamera,
        'fa-exclamation-triangle': SymbolAlertTriangle,
        'fa-image': EmblemImage,
        'fa-info-circle': SymbolInfoCircle,
        'fa-times': SymbolXLight,
        'fa-trash': EmblemTrash,
        'fa-video-camera': EmblemVideoCamera,
        'hs-comment': SymbolChatBox,
        'hs-recurring': EmblemSingleCopies,
        'hs-reply': ActionReply,
    }

    const glyph = obsoleteHsNestIconsToFeGlobalGlyphs[iconName]

    if (!glyph) {
        return null
    }

    const tmpContainer = document.createElement('div')
    ReactDOM.render(<Icon className={iconClass} fill={iconFill} size={iconSize} glyph={glyph} />, tmpContainer)
    return tmpContainer.innerHTML
};

window.hsEjs = hsEjs;

export default hsEjs;

