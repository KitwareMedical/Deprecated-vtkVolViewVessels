import Store from './stores';
import { Action } from '../state';

export const loadTubes = Action('loadTubes', () => () => { /* noop */ });
export const listenForTubes = Action('listenForTubes', () => () => { /* noop */ });

export const addTube = tube => (data) => {
  const newTube = Object.assign({
    visible: true,
  }, tube);

  // only add tube if pending or is a successful tube segmentation
  if (tube.status === 'pending' || (tube.status === 'done' && tube.mesh)) {
    return {
      ...data,
      tubeOrder: [...data.tubeOrder, tube.id],
      tubes: { ...data.tubes, [tube.id]: newTube },
    };
  }
  // return without modification
  return data;
};

export const addTubeBulk = tubes => (data) => {
  const tubeIds = tubes.map(tube => tube.id);
  const newTubes = [];
  tubes.forEach((tube) => {
    newTubes[tube.id] = Object.assign({
      visible: true,
    }, tube);
  });

  return {
    ...data,
    tubeOrder: [
      ...data.tubeOrder,
      ...tubeIds,
    ],
    tubes: {
      ...data.tubes,
      ...newTubes,
    },
  };
};

export const deleteTube = Action('deleteTube', id => (data) => {
  const tubeOrder = data.tubeOrder.filter(i => i !== id);
  const tubes = Object.assign({}, data.tubes);
  delete tubes[id];
  return {
    ...data,
    tubeOrder,
    tubes,
  };
});

export const updateTube = tube => (data) => {
  if (tube.id in data.tubes) {
    if (tube.status === 'pending' || (tube.status === 'done' && tube.mesh)) {
      return {
        ...data,
        tubes: {
          ...data.tubes,
          [tube.id]: Object.assign(data.tubes[tube.id], tube),
        },
      };
    }
    // tube should be tossed out
    return deleteTube(tube.id)(data);
  }
  // we haven't seen this tube, so add it
  return addTube(tube)(data);
};

export const setTubeVisibility = (id, visible) => data => ({
  ...data,
  tubes: {
    ...data.tubes,
    [id]: {
      ...data.tubes[id],
      visible,
    },
  },
});

export const setTubeColor = Action('setTubeColor', (id, color) => data => ({
  ...data,
  tubes: {
    ...data.tubes,
    [id]: {
      ...data.tubes[id],
      color: [color.r / 255, color.g / 255, color.b / 255],
    },
  },
}));

export const reparentTubes = Action('reparentTubes', newParentId => (data) => {
  const tubes = Object.assign({}, data.tubes);
  data.selection.rows.forEach((tube) => {
    tubes[tube.id].parent = newParentId;
  });

  return {
    ...data,
    tubes,
    selection: {
      keys: [],
      rows: [],
    },
  };
});

export const setSelection = (keys, rows) => data => ({
  ...data,
  selection: {
    keys,
    rows,
  },
});

export const tubeSideEffects = api => (store, action) => {
  switch (action.name) {
    case 'listenForTubes':
      api.addEventListener('segment', tube => store.dispatch(updateTube(tube)));
      break;

    case 'loadTubes':
      api.loadTubes()
        .then(tubes => store.dispatch(addTubeBulk(tubes)));
      break;

    case 'setTubeColor': {
      const [id, color] = action.args;
      const normColor = [color.r / 255, color.g / 255, color.b / 255];
      api.setTubeColor(id, normColor);
      break;
    }

    case 'deleteTube':
      api.deleteTube(...action.args);
      break;

    case 'reparentTubes':
      api.reparentTubes(...action.args, store.selection.rows.map(tube => tube.id));
      break;

    default:
      break;
  }
};

// export default
export const data = () => ({
  tubeOrder: [],
  tubes: {},
  selection: {
    keys: [],
    rows: [],
  },
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
