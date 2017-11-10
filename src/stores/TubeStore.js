import Store from './stores';

// export default
export const data = () => ({
  tubeOrder: [],
  tubes: {},
});

export default class TubeStore extends Store {
  constructor() {
    super();
    this.privateData = {
      tubes: [],
      selection: {
        keys: [],
        values: [],
      },

      loading: false,
    };
  }

  get data() {
    return this.privateData;
  }

  set loading(state) {
    this.privateData.loading = state;
    this.update();
  }

  set tubes(tubes) {
    this.privateData.tubes = tubes;
    this.update();
  }

  addTubes(tubes) {
    this.privateData.tubes = this.privateData.tubes.concat(tubes);
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

  setSelection(keys, values) {
    this.privateData.selection.keys = keys;
    this.privateData.selection.values = values;
    this.update();
  }
}
