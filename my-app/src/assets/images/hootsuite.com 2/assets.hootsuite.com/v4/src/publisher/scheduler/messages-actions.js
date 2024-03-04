import "jquery";

export default {
    disableOptions: function () {
        $("._messagesActionBtn")
            .addClass("disabled")
            .attr("aria-disabled", "true")
            .hsDropdown("option", "mute", true);
        $("#deleteMessagesBtn, ._deleteMessagesBtn")
            .addClass("disabled")
            .attr("aria-disabled", "true");
    },
    enableOptions: function () {
        $("._messagesActionBtn")
            .removeClass("disabled")
            .attr("aria-disabled", "false")
            .hsDropdown("option", "mute", false);
        $("#deleteMessagesBtn, ._deleteMessagesBtn")
            .removeClass("disabled")
            .attr("aria-disabled", "false");
    },
};
