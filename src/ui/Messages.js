import React from 'react';
import PropTypes from 'prop-types';
import { autorun } from 'mobx';

import { notification, message } from 'antd';

class Messages extends React.Component {
  constructor(props) {
    super(props);
    this.closeHandlers = new Map();

    const { imageStore } = this.props.stores;

    autorun(() => this.errorOrLoad(imageStore));
  }

  errorOrLoad(store) {
    this.showLoading(store);
    this.showError(store);
  }

  showLoading(store) {
    if (store.loading && !this.closeHandlers.has(store)) {
      const close = message.loading(store.loading, 0);
      this.closeHandlers.set(store, close);
    } else if (!store.loading && this.closeHandlers.has(store)) {
      const close = this.closeHandlers.get(store);
      close();
      this.closeHandlers.delete(store);
    }
  }

  showError(store) {
    if (store.lastError.title || store.lastError.description) {
      notification.error({
        message: store.lastError.title,
        description: store.lastError.description,
      });
    }
  }

  render() {
    return null;
  }
}

Messages.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default Messages;
