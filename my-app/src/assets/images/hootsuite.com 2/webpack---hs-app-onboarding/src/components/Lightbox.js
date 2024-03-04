import React from 'react';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';
import { uuid } from 'fe-lib-uuid';
import { provisionIndex } from 'fe-lib-zindex';
import { func } from 'fe-prop-types';

const LIGHTBOX_CONTAINER_ID = '_lightboxContainer';
const LIGHTBOX_PADDING = '80px';
const ESC = 27;

const LightboxOverlay = styled.div`
  position: fixed;
  display: flex;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: ${p => p.zIndex};
  justify-content: center;
  align-items: center;
  padding: ${LIGHTBOX_PADDING};
  backdrop-filter: blur(10px);
  // on small displays and zoomed large displays, reduce padding to give children as much space as possible
  // when zooming, kicks in roughly around 175% on a 13" laptop
  @media (max-width: 960px) {
    padding: 4%;
  }
`;

class Lightbox extends React.Component {
  constructor(props) {
    super(props);

    this.isAllowedToClose = true;

    this.lightboxContainer = document.createElement('div');
    this.lightboxContainer.id = `${LIGHTBOX_CONTAINER_ID}-${uuid()}`;
    this.allowClose = this.allowClose.bind(this);
    this.closeAndRemove = this.closeAndRemove.bind(this);
    this.onBackgroundClick = props.onBackgroundClick;
  }

  static propTypes = {
    children: func.isRequired,
    onBackgroundClick: func,
    onClose: func,
  };

  static defaultProps = {
    onBackgroundClick: () => false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClose: () => {},
  };

  allowClose(allowed) {
    this.isAllowedToClose = allowed;
  }

  /**
   * Removes the component.
   * @param onClose:
   * A function that is always ran when passed. Can return false to block the close, otherwise only used for its side effects.
   * Not passing onClose will simply close and remove the component
   */
  closeAndRemove(onClose) {
    let closeAllowed = true;
    if (onClose && typeof onClose === 'function') {
      closeAllowed = onClose();
    }
    //If the function didn't return anything or something other than a boolean, continue with the close
    if (typeof closeAllowed !== 'boolean') {
      closeAllowed = true;
    }
    if (this.isAllowedToClose && closeAllowed) {
      createRoot(this.lightboxContainer).unmount();
      this.props.onClose();
    }
  }

  componentDidMount() {
    document.body.appendChild(this.lightboxContainer);
    this.renderToContainer();
  }

  componentDidUpdate() {
    this.renderToContainer();
  }

  componentWillUnmount() {
    document.body.removeChild(this.lightboxContainer);
  }

  renderToContainer() {
    createRoot(this.lightboxContainer).render(
      // role="button" isn't applicable because we don't want this focusable
      // but do want to support dismissal with keyboard input -- disabling the rule is the closest we'll get right now
      // eslint-disable-next-line styled-components-a11y/no-static-element-interactions
      <LightboxOverlay
        zIndex={provisionIndex()}
        onClick={ev => {
          if (ev.target === this.lightboxContainer.children[0]) {
            return this.closeAndRemove(this.onBackgroundClick);
          }
        }}
        onKeyDown={ev => {
          const { keyCode } = ev;
          if (keyCode !== ESC) {
            return;
          }
          return this.closeAndRemove(this.onBackgroundClick);
        }}
      >
        {this.props.children({
          close: this.closeAndRemove,
          allowClose: this.allowClose,
        })}
      </LightboxOverlay>,
    );
  }

  render() {
    return null;
  }
}

export { Lightbox };
