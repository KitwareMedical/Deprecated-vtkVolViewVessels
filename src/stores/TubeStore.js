import Store from './stores';

export default class TubeStore extends Store {
  constructor() {
    super();
    this.privateData = {
      tubes: [],
      selection: {
        keys: [],
        values: [],
      },
    };
  }

  get data() {
    return this.privateData;
  }
}
