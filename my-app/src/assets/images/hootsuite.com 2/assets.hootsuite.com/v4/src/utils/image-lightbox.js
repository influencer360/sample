import $ from 'jquery';
import _ from 'underscore';
import Popup from 'utils/dialogs/base';
import translation from 'utils/translation';

var displaySources = ['instagram']; //image sources for which an external link should be displayed

var extractImageSrc = function (img) {
    return _.isObject(img) ? _.result(img, 'src') : img;
};

var extractImageLinkText = function (img) {
    return _.isObject(img) ? _.result(img, 'linkText') : null;
};

var extractImageLinkHref = function (img) {
    return _.isObject(img) ? _.result(img, 'linkHref') : null;
};

var extractImageSource = function (img) {
    return _.isObject(img) ? _.result(img, 'linkSource') : null;
};

var keyboardNavigationHandler = function(e) {
    var $el = null;
    switch (e.key) {
        case 'ArrowLeft':
            $el = document.getElementsByClassName("_imageLightboxPrev")[0];
            break;
        case 'ArrowRight':
            $el = document.getElementsByClassName("_imageLightboxNext")[0];
            break;
        case 'Escape':
            $el = document.getElementsByClassName("_imageLightboxClose")[0];
            break;
        default:
            break;
    }

    if ($el) {
        $el.click();
    }
}

export default Popup.extend({
    popupId: 'imageLightbox',
    params: {
        closeOnOverlayClick: true,
        draggable: false,
        isMedia: true,
        noChrome: true,
        modal: true,
        width: 'auto'
    },
    options: {
        imgArray: [], // array of image urls
        displayImg: null // array index to display
    },
    template: 'stream/image-lightbox',
    getTmplData: function () {
        return this.options;
    },
    events: {
        'click ._imageLightboxPrev': 'imageLightboxPrev',
        'click ._imageLightboxNext': 'imageLightboxNext',
        'click ._imageLightboxClose': 'close',
        'hover ._imageLightboxPrev': 'showTabPrev',
        'hover ._imageLightboxNext': 'showTabNext'
    },
    initialize: function (options) {
        window.document.addEventListener("keydown", keyboardNavigationHandler, true);
        if (options) {
            _.extend(this, _.pick(options, 'data', 'template', 'popupId'));
            if (options.params) {
                _.extend(this.params, options.params);
            }
        }
    },
    onRender: function () {
        var $el = this.$el;
        this.$index = $el.parent().find('._imagesIndex');
        this.$image = $el.find('._lightboxImage');
        this.$container = $el.find('._imageLightboxContainer');
        this.$prevTab = $el.find('._arrowTabPrev');
        this.$nextTab = $el.find('._arrowTabNext');
        this.$attribution = $el.find('._imageAttribution');

        this.heightCoefficient = 0.8;

        if (this.hasLink() && this.isGallery()) {
            // make room for links
            this.heightCoefficient = 0.7;
        }

        this.$image.attr('src', extractImageSrc(this.options.imgArray[this.options.displayImg]));

        // updates lightbox styles when react modal styles are applied
        $el.css('padding', 0);
        $el.css('margin-top', '-4px');

        this.postLoad();
    },
    postLoad: function () {
        var self = this;
        this.$image.load(function () {
            $(this).show();
            self.resize();
            self.center();
            self.updateIndex();
            self.updateImageAttribution();
        });
    },
    imageLightboxPrev: function () {
        if (this.options.displayImg <= 0) {
            this.options.displayImg = this.options.imgArray.length - 1;
        } else {
            this.options.displayImg--;
        }
        this.$image.attr('src', extractImageSrc(this.options.imgArray[this.options.displayImg]));
        this.postLoad();
    },
    imageLightboxNext: function () {
        this.options.displayImg = (this.options.displayImg + 1) % this.options.imgArray.length;
        this.$image.hide();
        this.$image.attr('src', extractImageSrc(this.options.imgArray[this.options.displayImg]));
        this.postLoad();
    },
    showTabPrev: function () {
        this.$prevTab.toggleClass('x-hover');
    },
    showTabNext: function () {
        this.$nextTab.toggleClass('x-hover');
    },
    updateIndex: function () {
        // L10N: %1$s is the number of the current image, and %2$s is the total number of images in the gallery. E.g. '2 of 4'
        this.$index.text(translation._("%1$s of %2$s").replace("%1$s", this.options.displayImg + 1).replace("%2$s", this.options.imgArray.length));
    },
    updateImageAttribution: function () {
        if (!this.$attribution.length) {
            return;
        }
        var img = this.options.imgArray[this.options.displayImg];
        var source = extractImageSource(img);
        if (_.contains(displaySources, source)) {
            var url = extractImageLinkHref(img);
            var text = extractImageLinkText(img);

            if (url && text) {
                var $a = this.$attribution.children('._link');
                var $icon = this.$attribution.children('._sourceIcon');

                if (!$a.length) {
                    $a = $('<a class="_link"></a>');
                }

                if (!$icon.length) {
                    $icon = $('<span class="icon-sn-30 -sourceIcon _sourceIcon"></span>');
                }

                $a.attr('href', url);
                $a.text(text);
                $a.attr('target', '_blank');

                $icon.addClass(source + '-white');

                this.$attribution.empty().append($a).append($icon).show();
                this.$container.addClass('x-withLink');
            } else {
                this.$attribution.hide();
                this.$container.removeClass('x-withLink');
            }
        }
    },
    resize: function () {
        // load image outside the DOM to obtain full height and width
        var image = new Image();
        image.src = this.$image.attr("src");
        var imageWidth = image.width;
        var imageHeight = image.height;
        var containerWidth = this.$container.width();
        var containerHeight = this.$container.height();
        var maxWidth = $(window).width() * 0.8;
        var maxHeight = $(window).height() * this.heightCoefficient;
        var imageAspect = imageWidth / imageHeight;
        var maxAspect = maxWidth / maxHeight;
        if (imageWidth > containerWidth || imageHeight > containerHeight) {
            if (imageAspect > maxAspect) {
                if (imageWidth >= maxWidth) {
                    this.$container.width(maxWidth);
                    if (maxWidth / imageAspect > containerHeight) {this.$container.height(maxWidth / imageAspect); }
                } else {
                    if (imageWidth > containerWidth) {
                        this.$container.width(imageWidth);
                    }
                    this.$container.height(imageHeight);
                }
            } else {
                if (imageHeight >= maxHeight) {
                    this.$container.height(maxHeight);
                    if (maxHeight * imageAspect > containerWidth) {this.$container.width(maxHeight * imageAspect); }
                } else {
                    this.$container.width(imageWidth);
                    if (imageHeight > containerHeight) {
                        this.$container.height(imageHeight);
                    }
                }
            }
        }
    },
    center: function () {
        this.$el.dialog('option', 'position', ['center', 'center']);
    },
    close: function () {
        this.onPopupClose();
        window.document.removeEventListener("keydown", keyboardNavigationHandler, true);
    },
    hasLink: function () {
        return _.filter(this.options.imgArray, function (img) {
            return _.isObject(img) && _.has(img, 'src') && _.has(img, 'linkText');
        }).length > 0;
    },
    isGallery: function () {
        return this.options.imgArray.length > 1;
    }
});

