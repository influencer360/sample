import '3rd/jquery-1.7.1';
import _ from 'underscore';

window._ = _

import 'hs-nest/lib/utils/hootbus';
import 'utils/darklaunch';
import 'rjs/hs_require';
import 'core-js/shim';
import 'whatwg-fetch';
import 'fe-lib-theme-provider';
import { loadMaterialSymbols } from '@fp-icons/icon-base';

import { registerHsAppsLoaderSingleton } from 'fe-lib-async-app';

registerHsAppsLoaderSingleton();
loadMaterialSymbols();

if (!window.HashChangeEvent) {
    (function () {
        var lastURL = document.URL;
        window.addEventListener("hashchange", function (event) {
            Object.defineProperty(event, "oldURL", {enumerable: true, configurable: true, value: lastURL});
            Object.defineProperty(event, "newURL", {enumerable: true, configurable: true, value: document.URL});
            lastURL = document.URL;
        });
    }());
}

// https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove#Polyfill
(function (arr) {
    arr.forEach(function (item) {
        if (Object.prototype.hasOwnProperty.call(item, "remove")) {
            return;
        }
        Object.defineProperty(item, 'remove', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                if (this.parentNode !== null) {
                    this.parentNode.removeChild(this);
                }
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
