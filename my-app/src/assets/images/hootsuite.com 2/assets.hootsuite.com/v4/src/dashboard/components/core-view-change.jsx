import React from 'react';
import PropTypes from 'prop-types';
import hootbus from 'utils/hootbus';

class CoreViewChange extends React.PureComponent {
  componentDidMount() {
    hootbus.on('coreViews:changed', this.props.onChange);
  }

  componentWillUnmount() {
    hootbus.removeListener('coreViews:changed', this.props.onChange);
  }

  render() {
    return this.props.children;
  }
}

CoreViewChange.propTypes = {
  children: PropTypes.node.isRequired,
  onChange: PropTypes.func
};
CoreViewChange.defaultProps = {
  onChange: () => {}
};

export default CoreViewChange;
