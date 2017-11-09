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

  addTube(tube) {
    this.privateData.tubes.push(tube);
    this.update();
  }

  hasTube(tube) {
    return this.privateData.tubes.find(t => tube.id === t.id) !== undefined;
  }

  updateTube(tube) {
    const tubeIndex = this.privateData.tubes.findIndex(t => tube.id === t.id);
    if (tube.mesh) {
      if (tubeIndex > -1) {
        Object.assign(this.privateData.tubes[tubeIndex], tube);
      } else {
        this.privateData.tubes.push(tube);
      }
      this.update();
    } else if (tubeIndex > -1) {
      // if no mesh, then no tube was segmented.
      this.privateData.tubes.splice(tubeIndex, 1);
    }
  }
}
