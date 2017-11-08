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
