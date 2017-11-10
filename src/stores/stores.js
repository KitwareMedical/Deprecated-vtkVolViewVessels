class Store2 {
  constructor(data, ...actionArgs) {
    this.privateData = data;
    this.privateListeners = [];
    this.privateActionArgs = actionArgs;

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
    const result = action(this.privateData, this.setData, ...this.privateActionArgs);
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

export const createStore = (data, ...args) => new Store2(data, ...args);

export default class Store {
  constructor() {
    this.privateData = null;
    this.privateListeners = [];
  }

  get data() {
    throw new Error('.data() not implemented');
  }

  update() {
    this.privateListeners.forEach(func => func());
  }

  addChangeListener(func) {
    this.privateListeners.push(func);
  }

  removeChangeListener(func) {
    this.privateListeners.splice(this.privateListeners.indexOf(func), 1);
  }
}
