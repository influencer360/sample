/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components';
import { BouncingBars } from 'fe-comp-loader';
import { provisionIndex } from 'fe-lib-zindex';

const LoaderContainer = styled.div.attrs({ className: 'LoadingModal' })`
    position: fixed;
    background-color: rgba(47,54,56,0.92);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    z-index: ${p => p.zIndex};
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
`;

class LoadingModal extends React.PureComponent {
    render() {
        return (
            <LoaderContainer zIndex={provisionIndex()}>
                <BouncingBars fill={'#fff'} />
            </LoaderContainer>
        )
    }
}

LoadingModal.displayName = 'LoadingModal';

export const closeLoadingModal = function () {
    let parentNode = document.querySelector('#loadingModalMountPoint');
    if (parentNode) {
        ReactDOM.unmountComponentAtNode(parentNode);
    }
};

export const renderLoadingModal = function () {
    // only render the modal if its not already there
    let queryNode = document.querySelector('.LoadingModal');
    if (queryNode === null) {
        let parentNode = document.querySelector('#loadingModalMountPoint');
        if (parentNode === null) {
            parentNode = document.createElement('div');
            parentNode.id = 'loadingModalMountPoint';
            document.body.appendChild(parentNode);
        }
        ReactDOM.render(<LoadingModal/>, parentNode);
    }
};
