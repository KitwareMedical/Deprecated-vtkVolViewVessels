import React from 'react';
import PropTypes from 'prop-types';

function partial(func, ...args) {
  return (...moreArgs) => {
    func(...args, ...moreArgs);
  };
}

export function connectAction(srcStore, watchedKey, dstStore, action) {
  const listenForChanges = (changedKeys) => {
    if (changedKeys.includes(watchedKey)) {
      console.log('connectAction', watchedKey, srcStore[watchedKey]);
      dstStore.dispatch(action(srcStore[watchedKey]));
    }
  };
  srcStore.addChangeListener(listenForChanges);

  const disconnect = () => srcStore.removeChangeListener(listenForChanges);
  return disconnect;
}

export function connectComponent(Component, storeNames, mapStoreToProps, actions) {
  let names = storeNames || [];
  if (typeof names === 'string') {
    names = [names];
  }

  const storeMapper = mapStoreToProps || (() => ({}));

  class ConnectedComponent extends React.Component {
    constructor(props) {
      super(props);

      const { stores } = props;
      if (!stores) {
        throw new Error('This component requires a "stores" prop!');
      }

      this.stores = stores;

      // TODO make errors in the mappers less nebulous
      this.state = storeMapper(stores, props);
      this.actions = actions;

      this.onStoreChanged = this.onStoreChanged.bind(this);
    }

    componentDidMount() {
      names.forEach(name =>
          this.stores[name].addChangeListener(partial(this.onStoreChanged, name)));
    }

    componentWillUnmount() {
      names.forEach(name =>
          this.stores[name].removeChangeListener(partial(this.onStoreChanged, name)));
    }

    onStoreChanged(storeName, changedKeys) {
      const subset = {};
      names.forEach((name) => { subset[name] = this.stores[name]; });

      console.log(storeName, changedKeys);
      this.setState(storeMapper(subset, this.props, storeName));
    }

    render() {
      return <Component {...this.state} {...this.props} />;
    }
  }

  ConnectedComponent.propTypes = {
    stores: PropTypes.object.isRequired,
  };

  return ConnectedComponent;
}
