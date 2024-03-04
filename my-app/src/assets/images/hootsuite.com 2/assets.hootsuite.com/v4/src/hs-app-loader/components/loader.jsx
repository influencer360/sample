'use strict';

import React from 'react';
import { BouncingBars } from 'fe-comp-loader';

import './loader.less';

/**
 * Note: the dashboard is only responsible for showing the loading animation while asynchronously
 * fetching/loading hs-app-inbox. After this all inbox functionality lives outside the dashboard
 * @returns {Object}
 */
const LoadingRoot = () => {
    const height = window.innerHeight + 'px';
    return <div className='rc-LoaderRoot' style={{ height: height }}>
        <div className='-loaderWrapper'>
            <BouncingBars />
        </div>
    </div>
}

LoadingRoot.displayName = 'LoadingRoot';

export default LoadingRoot;
