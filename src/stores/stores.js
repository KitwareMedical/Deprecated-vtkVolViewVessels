/**
 * Creates a new store.
 *
 * A list of side effects can be given as a sequence of Functions.
 * Each side effect will be called with (store, action).
 */
export default class Store {
  constructor(data, ...sideEffects) {
    this.privateData = data;
    this.privateListeners = [];
    this.privateSideEffects = sideEffects;

    this.setData = this.setData.bind(this);

    return new Proxy(this, {
      get(target, name) {
        if (name in target) {
          return target[name];
        }
        if (name in target.privateData) {
          return target.privateData[name];
        }
        throw new Error(`Could not find property ${name}`);
      },
    });
  }

  dispatch(action) {
    this.privateSideEffects.forEach(sideEffect => sideEffect(this, action));
    const result = action(this.privateData, this.setData);
    if (action.length === 1 && typeof result === 'object') {
      // this is a simple case, so we just call setData automatically
      this.setData(result);
    }
  }

  setData(newData) {
    const changedKeys = [];

    if (Object.keys(this.privateData).length !== Object.keys(newData).length) {
      throw new Error('setData: old and new data do not have the same number of keys!');
    }

    Object.keys(this.privateData).forEach((key) => {
      if (!(key in newData)) {
        throw new Error(`setData: key ${key} not set in new data!`);
      }
      if (newData[key] !== this.privateData[key]) {
        changedKeys.push(key);
      }
    });

    this.privateData = newData;
    this.update(changedKeys);
  }

  update(changedKeys) {
    this.privateListeners.forEach(func => func(changedKeys));
  }

  addChangeListener(func) {
    this.privateListeners.push(func);
  }

  removeChangeListener(func) {
    this.privateListeners.splice(this.privateListeners.indexOf(func), 1);
  }

}
