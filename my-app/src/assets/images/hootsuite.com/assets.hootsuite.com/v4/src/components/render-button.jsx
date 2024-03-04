/** @preventMunge */
'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import Button from 'hs-nest/lib/components/buttons/button';

const renderButton = (parentNode, props, text) => {
  ReactDOM.render(
    <Button  {...props}>{text}</Button>, parentNode
  );
};

export default renderButton;
