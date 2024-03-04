import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import objectAssign from 'object-assign';
import classNames from 'classnames';
import coreViewUtils from '../utils/core-view';
const viewId = coreViewUtils.getId();

class SecondaryView extends React.Component {
  renderHtml() {
    const { show, content } = this.props;
    if (show) {
      if (_.isString(content)) {
        this.childrenSetWithJquery = $(content)
        coreViewUtils.getjQueryElement().html(this.childrenSetWithJquery);
      } else if (content instanceof HTMLElement) {
        this.childrenSetWithJquery = [content]
        coreViewUtils.getjQueryElement().html('').append(content);
      }
    }
  }

  render() {
    const { show, content, params, flux } = this.props;
    const classes = {
        'u-displayNone': !show
    };
    const childProps = objectAssign({}, params, { flux: flux });
    const child = show && _.isFunction(content) ? React.createElement(content, childProps) : null;

    return (
      <div id={viewId} className={classNames(classes)} style={{height: '100%'}}>
        {child}
      </div>
    );
  }

  componentDidMount() {
    this.childrenSetWithJquery = []
    this.renderHtml();
  }

  componentDidUpdate() {
    this.renderHtml();
  }

  UNSAFE_componentWillUpdate() {
    // Remove all direct children that are not react elements.
    // This is terrible and all the primary/secondary view code
    // needs to be cleaned up to not add things in using jquery.
    if (this.childrenSetWithJquery && this.childrenSetWithJquery.length > 0) {
      for (let i=0,il=this.childrenSetWithJquery.length; i<il; i++) {
        this.childrenSetWithJquery[i].remove()
      }
      this.childrenSetWithJquery = []
    }
  }
}

SecondaryView.displayName = 'SecondaryView';

SecondaryView.propTypes = {
  show: PropTypes.bool,
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
    PropTypes.instanceOf(HTMLElement),
  ]),
  params: PropTypes.object,
  flux: PropTypes.object,
};

SecondaryView.defaultProps = {
  show: false,
  content: ''
};

export default SecondaryView;
