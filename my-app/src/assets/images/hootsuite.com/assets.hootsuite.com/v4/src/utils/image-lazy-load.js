import $ from 'jquery';
import _ from 'underscore';

/**
 * Function for lazy loading of social network profile avatars in message box profile selector.
 * @constructor
 */
var ImageLazyLoad = function ($container) {
    'use strict';

    /*
     * Constructor
     */
    var LoadImages = function (elems) {
        this.elems = elems;
        this.listen();
    };

    var $imgStore = [];

    /*
     * Determines if an image is visible. Loads 300 px below message box for uninterrupted experience.
     */
    var isVisible = function (element) {
        var coords = element.getBoundingClientRect();
        return (coords.top >= 0 && coords.left >= 0 && (coords.top <= $container.innerHeight() + 300));
    };

    /*
     * Loads all visible images and removes them from list of unloaded images
     */
    var lazyLoadImages = function () {
        var length = $imgStore.length;
        var $img; // used to keep track of the current image we're iterating over

        for (var i = 0; i < length; i++) {
            $img = $imgStore[i];
            if (isVisible($img[0])) {
                $img[0].src = $img.data('avatar');
            } else {
                // Once we hit an invisible image, there won't be any visible ones following it, so we end the loop.
                break;
            }
        }

        // remove the loaded images from the array
        $imgStore = $imgStore.slice(i);
    };

    /*
     * Prototype setup
     * init: Add all images to array then load all visible images
     * listen: On scroll, load all visible images
     */
    LoadImages.prototype = {
        init: function () {
            this.elems.each(function () {
                $imgStore.push($(this));
            });
            lazyLoadImages();
        },
        listen: function () {
            $container.on('scroll', _.debounce(lazyLoadImages));
        }
    };

    var $lazyImgs = $container.find('img[data-avatar]');

    // Instantiate and init lazy loading
    var loadImagesInstance = new LoadImages($lazyImgs);
    loadImagesInstance.init($lazyImgs);
};

export default ImageLazyLoad;
