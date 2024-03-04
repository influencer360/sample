import 'utils/ajax';

/**
 * Parses HTTP-Date formatted date strings (RFC 1123) to a JavaScript Date object.
 * @param dateHeader
 * @returns {number}
 */
var parseDateHeader = function (dateHeader) {
    return Date.parse(dateHeader);
};

var timeSplit = 0;

export default {
    init: function () {
        // Send an ajax request to the get-status endpoint. The response will include a Date header.
        ajaxCall({
            type: 'GET',
            url: '/api/2/misc/get-status'
        }, 'q1')
            .done(function (data, status, xhr) {
                // Read the Date header of the response and parse it out
                var dateHeader = xhr.getResponseHeader("Date");
                var parsedDate = new Date(parseDateHeader(dateHeader));

                // Compute the difference between the server time and our local time
                var localDate = Date.now();
                timeSplit = localDate - parsedDate.getTime();
            });
    },
    now: function () {
        // Compute the current server time by adding the split to the current time
        var localNow = Date.now();
        return new Date(localNow - timeSplit);
    }
};
