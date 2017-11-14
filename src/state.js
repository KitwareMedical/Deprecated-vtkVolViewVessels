import React from 'react';
import PropTypes from 'prop-types';

function partial(func, ...args) {
  return (...moreArgs) => {
    func(...args, ...moreArgs);
  };
}

/**
 * Optionally sets the name and args of a wrapped action.
 *
 * This is useful when side effects need to get info about an action.
 */
export const Action = (name, func) => {
  const wrapper = (...args) => {
    const innerFunc = func(...args);
    // set name
    Object.defineProperty(innerFunc, 'name', { writable: true });
    innerFunc.name = name;
    // set args
    innerFunc.args = args;

    return innerFunc;
  };
  return wrapper;
};

/**
 * Connects a store update to an action.
 *
 * This will listen for changes in srcStore for watchedKey. When the data
 * updates, then the appropriate action, with the changed data as the sole
 * argument, is dispatched on dstStore.
 */
export function connectAction(srcStore, watchedKey, dstStore, action) {
  const listenForChanges = (changedKeys) => {
    if (changedKeys.includes(watchedKey)) {
      dstStore.dispatch(action(srcStore[watchedKey]));
    }
  };
  srcStore.addChangeListener(listenForChanges);

  const disconnect = () => srcStore.removeChangeListener(listenForChanges);
  return disconnect;
}

/**
 * Connects a set of stores to a component.
 *
 * This returns a higher-order component that listens for changes on a list of stores.
 * If a change is detected, the mapStoreToProps method is called with the changed stores,
 * and then the resulting object is passed into Component as props.
 */
export function connectComponent(Component, storeNames, mapStoreToProps) {
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

      const newState = storeMapper(subset, this.props, storeName, changedKeys);
      if (newState) {
        this.setState(newState);
      }
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
