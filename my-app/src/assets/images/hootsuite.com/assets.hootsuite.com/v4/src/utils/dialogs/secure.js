import $ from 'jquery';
import hsEjs from 'utils/hs_ejs';
import dialogFactory from 'utils/dialogfactory';
import translation from 'utils/translation';
import '3rd/jquery-ui';

export default function (retweetSn, retweetFunc, closeFunc) {
    var html = hsEjs.getEjs('dashboard/securepostpopup').render({accounts: retweetSn}),
        params = {
            modal: true,
            draggable: false,
            width: 400,
            title: translation._("Confirm Ownership"),
            position: ['center', 67],
            noChrome: 1,
            close: $.noop
        },
        $popup = dialogFactory.create('securePostPopup', params),
        fnDoPost = function () {
            retweetFunc();
            //Check to see if the close function is declared
            if ($.isFunction(closeFunc)) {
                closeFunc();
            }
            $popup.dialog('close');
        };

    $popup.append(html).find('._confirm').click(function () {
        fnDoPost();
        return false;
    }).end().find('._cancel').click(function () {
        $popup.dialog('close');
        //Check to see if the close function is declared
        if ($.isFunction(closeFunc)) {
            closeFunc();
        }
        return false;
    }).end();

    var $slideToPost = $('._slideToPost'),
        $sliderMsg = $popup.find('._sliderMessage');
    $slideToPost.slider('destroy').slider({
        animate: true,
        stop: function (e, ui) {
            if (ui.value < 90) {
                $slideToPost.slider('value', 0);
                $sliderMsg.css({opacity: 1});
            } else {
                $slideToPost.slider('value', 100);
                fnDoPost();
            }
        },
        slide: function (e, ui) {
            var opacity = 0;
            if (ui.value < 75) {
                opacity = 100 - (ui.value * 2);
            }
            $sliderMsg.css({opacity: opacity / 100});
        }
    });
}

