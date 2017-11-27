import React from 'react';
import PropTypes from 'prop-types';
import { autorun } from 'mobx';

import { notification, message } from 'antd';

class Messages extends React.Component {
  constructor(props) {
    super(props);
    this.closeHandlers = new Map();

    const { imageStore, tubeStore } = this.props.stores;
    this.listenForMessages(imageStore);
    this.listenForMessages(tubeStore);
  }

  listenForMessages(store) {
    autorun(() => this.showLoading(store));
    autorun(() => this.showError(store));
    autorun(() => this.showSuccess(store));
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
    this.showNotification(store, 'lastError', 'error');
  }

  showSuccess(store) {
    this.showNotification(store, 'lastSuccess', 'success');
  }

  showNotification(store, storeProperty, notificationType) {
    if (store[storeProperty].title || store[storeProperty].description) {
      notification[notificationType]({
        message: store[storeProperty].title,
        description: store[storeProperty].description,
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
