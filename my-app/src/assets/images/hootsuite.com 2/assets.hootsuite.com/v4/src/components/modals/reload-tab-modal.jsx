"use strict";

import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import translation from 'utils/translation';

import SimpleModal from 'hs-nest/lib/components/modal/simple-modal';
import Button from 'hs-nest/lib/components/buttons/button';

export default {
    render : function (idSelector) {
        var container = document.getElementById(idSelector);

        var handleHide = function () {
            //deferred because there are events binded to onRequestHide that needs access the node natively in react before it gets unmounted
            _.defer(function () {
                ReactDOM.unmountComponentAtNode(container);
                //TODO: remove jQuery dependency
                $('#' + idSelector).remove();
            });
        };

        var refreshBtnClicked = function () {
            window.location.reload();
        };

        var title = translation._('Your current session has timed out.');
        var refreshBtnText = translation._('Refresh');
        var footer = (
            <span>
                <Button btnStyle='primary' onClick={refreshBtnClicked}> {refreshBtnText} </Button>
            </span>
        );


        var modalBody;
        var p = translation._('Please refresh the page');

        modalBody= (
            <div className='modal-body'>
                <p>{p}</p>
            </div>
        );

        ReactDOM.render(
            <SimpleModal onRequestHide={handleHide} titleText={title} footerContent={footer}>
                {modalBody}
            </SimpleModal>,
            container
        );
    }
};
