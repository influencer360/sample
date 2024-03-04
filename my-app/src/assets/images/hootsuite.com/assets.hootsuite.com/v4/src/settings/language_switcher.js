import $ from 'jquery';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import hsEjs from 'utils/hs_ejs';

export default {
    defaults: {
        selectSelector: "#languageSelectionForm select[name='language']",
        langSep: "ar"
    },
    init: function (options) {
        var self = this;
        this.options = $.extend({}, this.defaults, options);
        this.$select = $(this.options.selectSelector);
        if (this.$select.length === 0) {
            return;
        }
        this.$select.find("option[value='" + this.options.langSep + "']:not(:last)").before('<option disabled="disabled">--------------------</option>');
        this.$select.bind('change', function (e) {
            self.changeLanguage(e);
        });
    },
    changeLanguage: function (_e) {
        hs.statusObj.update(translation._("Switching language..."), 'info', true, 8000);
        var lang = this.$select.find("option:selected").val();

        if (this.options.trackingOrigin) {
            var fullLang = this.$select.find("option:selected").text();
            trackerDatalab.trackCustom(this.options.trackingOrigin, 'language_changed', {languageSelected: fullLang});
        }

        ajaxCall({
            type: 'POST',
            data: "language=" + lang,
            url: "/ajax/index/change-language",
            success: function (data) {
                hs.statusObj.reset();
                if (data.success) {
                    // force reload
                    window.location.reload(true);
                } else if (data.inProgress) {
                    var params = {
                        width: 347,
                        maxHeight: 700,
                        resizable: false,
                        draggable: false,
                        position: ['center', 60],
                        modal: true,
                        title: translation._("Hootsuite Translation Project"),
                        content: hsEjs.getEjs('index/language_translation').render(data)
                    };
                    $.dialogFactory.create('inProgressLanguagePopup', params);
                    return false;
                } else {
                    if (data.paymentProcessorUnavailable && hs.statusObj) {
                        hs.statusObj.update(translation._("Sorry, we are unable to complete this operation right now. Please try again later."), "error", true);
                    }
                }
            },
            error: function () {
                hs.statusObj.reset();
            }
        }, 'abortOld');
        return false;
    }
};

