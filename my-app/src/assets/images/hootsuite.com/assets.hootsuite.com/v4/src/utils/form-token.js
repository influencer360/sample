import $ from 'jquery';
import 'utils/darklaunch';

export default function () {

    $(document).ready(function () {
        var body = $("body");
        body.undelegate("form", "submit");
        body.delegate("form", "submit", function () {
            var $this = $(this);
            // Only append the token field if it hasn't already been added (i.e. failed form submit)
            if ($this.find("input[name='csrfToken']").length === 0) {
                $this.append('<input type="hidden" name="csrfToken" value=' + hs.csrfToken + '>');
            }
        });
    });

}
