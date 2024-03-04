import React from "react";
import ReactDOM from "react-dom";
import _ from "underscore";
import AppBase from "core/app-base";
import hootbus from "utils/hootbus";
import translation from "utils/translation";
import trackerDatalab from "utils/tracker-datalab";
import { Dialog, Content, Header, Footer, Icons } from "fe-comp-dialog";
import domUtils from "hs-nest/lib/utils/dom-utils";
import styled from "styled-components";
import { getThemeValue, withHsTheme } from "fe-lib-theme";

const StyledDialog = styled(Dialog)`
    position: fixed;
    width: ${(props) => props.width};
    left: 50%;
    top: 50%;
    transform: translate3d(-50%, -50%, 0px);
`;

const Overlay = withHsTheme(styled.div`
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: ${() => getThemeValue((t) => t.colors.overlay.background)};
`);

export default AppBase.extend({
    messageEvents: {
        "modals:confirmation:modal:destroy": "closeModal",
    },

    onInitialize: function (options) {
        this.bodyText = options.bodyText;
        this.onCancelCallback = options.onCancelCallback || (() => {});
        this.onConfirmCallback = options.onConfirmCallback || (() => {});
        this.trackingOrigin = options.trackingOrigin || null;
        this.primaryBtnText = options.primaryBtnText;
        this.secondaryBtnText = options.secondaryBtnText;
        this.titleText = options.title || translation._("Please Confirm");
        this.width = options.width || "400px";

        this.container = document.createElement("div");
        this.container.setAttribute("id", "dialog-root");
        this.container.style.zIndex = domUtils.provisionIndex();
        this.container.style.position = "fixed";
        this.container.style.top = "0";
        this.container.style.left = "0";
        document.body.appendChild(this.container);

        ReactDOM.render(
            <div>
                <Overlay />
                <StyledDialog width={this.width} withA11y>
                    <Icons>
                        <Icons.Close close={this._onCancel.bind(this)} />
                    </Icons>
                    <Header>
                        <Header.Title>{this.titleText}</Header.Title>
                    </Header>
                    <Content>
                        <p className="-content">{this.bodyText}</p>
                    </Content>
                    <Footer>{this._confirmationFooter()}</Footer>
                </StyledDialog>
            </div>,
            this.container
        );
        this._addTtracking("modal_opened");
    },

    // eslint-disable-next-line react/display-name
    _confirmationFooter: function () {
        var primary = this.primaryBtnText ? (
            <Footer.Buttons.PrimaryAction onClick={this._onAccept.bind(this)}>
                {this.primaryBtnText}
            </Footer.Buttons.PrimaryAction>
        ) : null;
        var secondary = this.secondaryBtnText ? (
            <Footer.Buttons.SecondaryAction onClick={this._onCancel.bind(this)}>
                {this.secondaryBtnText}
            </Footer.Buttons.SecondaryAction>
        ) : null;

        return primary || secondary ? (
            <span>
                {" "}
                {secondary} {primary}{" "}
            </span>
        ) : null;
    },

    _addTtracking: function (eventToTrack) {
        if (this.trackingOrigin)
            trackerDatalab.trackCustom(this.trackingOrigin, eventToTrack);
    },

    _onCancel: function () {
        this.onCancelCallback();
        this._addTtracking("modal_cancel");
        this.closeModal();
    },

    _onAccept: function () {
        this.onConfirmCallback();
        this._addTtracking("modal_accept");
        this.closeModal();
    },

    closeModal: function () {
        var container = this.container;

        _.defer(function () {
            ReactDOM.unmountComponentAtNode(container);
            container.parentNode.removeChild(container);
        });

        this._addTtracking("modal_closed");
        AppBase.prototype.destroy.call(this);
        hootbus.emit("notify:overlay:closed", "modal", "confirmationModal");
    },
});
