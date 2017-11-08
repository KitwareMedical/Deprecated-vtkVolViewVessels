import Store from './stores';

export default class SegmentStore extends Store {
  constructor() {
    super();
    this.privateData = {
      scale: 2.0,
    };
  }

  get data() {
    return this.privateData;
  }

  set scale(value) {
    this.privateData.scale = value;
    this.update();
  }
}
