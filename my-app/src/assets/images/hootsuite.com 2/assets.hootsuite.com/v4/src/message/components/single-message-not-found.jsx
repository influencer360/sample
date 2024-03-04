'use strict';

import React from 'react';
import translation from 'utils/translation';

import './single-message-not-found.less';

class SingleMessageNotFound extends React.PureComponent {
  render() {
    return (
      <div className='rc-SingleMessageNotFound'>
        <div className='-SingleMessageNotFoundBanner' />
        <h2>{translation._("We couldn't find that post...")}</h2>
        <p>{translation._("The post you were looking for does not exist.")}</p>
        <p>{translation._("It may no longer be available, or you may no longer have permission to view it.")}</p>
      </div>
    );
  }
}
SingleMessageNotFound.displayName = 'SingleMessageNotFound';

export default SingleMessageNotFound;
