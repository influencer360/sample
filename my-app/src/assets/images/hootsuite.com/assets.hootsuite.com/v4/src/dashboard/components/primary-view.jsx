import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import coreViewUtils from '../utils/core-view';
const viewId = coreViewUtils.getId('primary');

class PrimaryView extends React.Component {
    renderHtml() {
        const { show, content } = this.props;

        if (show && typeof content === 'string') {
            const $view = coreViewUtils.getjQueryElement('primary');
            $view.html(content);
        }
    }
    render() {
        const classes = {};
        classes['u-displayNone'] = !this.props.show;
        return <div id={viewId} className={classNames(classes)}/>;
    }
    componentDidMount() {
        this.renderHtml();
    }
    componentDidUpdate() {
        this.renderHtml();
    }
}

PrimaryView.displayName = 'PrimaryView';

PrimaryView.propTypes = {
    show: PropTypes.bool,
    content: PropTypes.string,
};

PrimaryView.defaultProps = {
    show: true
};

export default PrimaryView;
