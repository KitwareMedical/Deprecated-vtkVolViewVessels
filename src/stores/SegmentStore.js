import Store from './stores';

export default class SegmentStore extends Store {
  constructor() {
    super();
    this.privateData = {
      scale: 2.0,
      jobs: 0,
    };
  }

  get data() {
    return this.privateData;
  }

  set scale(value) {
    this.privateData.scale = value;
    this.update();
  }

  set jobs(value) {
    this.privateData.jobs = value;
    // TODO maybe come up with an action(...) wrapper that calls this.update() at the end
    this.update();
  }
}
