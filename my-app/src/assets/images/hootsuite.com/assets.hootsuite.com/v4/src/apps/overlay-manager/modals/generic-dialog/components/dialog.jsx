import React from 'react'
import ReactDOM from 'react-dom'
import domUtils from 'hs-nest/lib/utils/dom-utils'
import styled from 'styled-components'
import { Content, Dialog, Footer, Header, Icons } from 'fe-comp-dialog'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import AppBase from 'core/app-base'
import hootbus from 'utils/hootbus'

const StyledDialog = styled(Dialog)`
    position: fixed;
    width: ${props => props.width};
    left: 50%;
    top: 50%;
    transform: translate3d(-50%, -50%, 0px);
`

const Spotlight = withHsTheme(styled.div`
    position:fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: ${() => getThemeValue(t => t.colors.overlay.background)};
`)

const WalkthroughDialog = AppBase.extend({
    name: 'dialog',
    messageEvents: {
        'dialog:close': 'destroy'
    },
    container: null,

    onInitialize: function(options) {
        options = options || {};
        this.options = options;
        this.container = document.createElement('div');
        this.container.setAttribute('id', 'dialog-root');
        this.container.style.zIndex = domUtils.provisionIndex();
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        document.body.appendChild(this.container);
        ReactDOM.render(
            <div>
                {options.spotlight && <Spotlight /> }
                <StyledDialog className={options.className || 'vk-Dialog'} width={options.width}>
                    <Icons>
                        <Icons.Close close={(e) => this.handleClose(e)} />
                    </Icons>
                    <Header>
                        <Header.Title>{options.title}</Header.Title>
                    </Header>
                    <Content>
                        {options.content}
                    </Content>
                    <Footer>
                        <Footer.Buttons.PrimaryAction onClick={(e) => this.handleCta(e)}>
                            {options.cta}
                        </Footer.Buttons.PrimaryAction>
                    </Footer>
                </StyledDialog>
            </div>,
            this.container
        );
    },

    handleClose: function(event) {
        event.stopPropagation();
        this.options.handleClose();
        this.destroy();
    },

    handleCta: function(event) {
        event.stopPropagation();
        this.options.handleCta();
        this.destroy();
    },

    destroy: function () {
        AppBase.prototype.destroy.call(this);
        ReactDOM.unmountComponentAtNode(this.container);
        this.container.parentNode.removeChild(this.container);
        hootbus.emit('notify:dialog:closed', 'wizard', this.name);
    }
});

export default WalkthroughDialog;
