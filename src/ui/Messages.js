import React from 'react';
import PropTypes from 'prop-types';

import { message } from 'antd';

import connect from '../state';

class Messages extends React.Component {
  constructor(props) {
    super(props);
    this.closeHandler = null;
  }

  componentWillReceiveProps(props) {
    const { loading: prevLoading } = this.props;
    const { loading: curLoading } = props;
    if (prevLoading !== curLoading) {
      if (curLoading) {
        this.closeHandler = message.loading('Loading...', 0);
      } else {
        this.closeHandler();
        this.closeHandler = null;
      }
    }
  }

  render() {
    return (
      <div />
    );
  }
}

Messages.propTypes = {
  loading: PropTypes.bool,
};

Messages.defaultProps = {
  loading: false,
};

export default connect(Messages, ['image'],
  // stores to props
  (stores, props) => ({
    loading: stores.image.data.loading,
  }));
