import $ from 'jquery';
import '3rd/jquery-ui';

$.ui.position.flipfirstorfit = {
    left: function (position, data) {
        var initPos = position.left;
        $.ui.position.flip.left(position, data);
        if (initPos != position.left && position.left < 0) {
            position.left = initPos;
            $.ui.position.fit.left(position, data);
        }
    },
    top: function (position, data) {
        var initPos = position.top;
        $.ui.position.flip.top(position, data);
        if (initPos != position.top && position.top < 0) {
            position.top = initPos;
            $.ui.position.fit.top(position, data);
        }

    }
};

