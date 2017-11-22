import { action, observable } from 'mobx';

// TODO extends LoadAndErrorStore
export default class TubeStore {
  @observable tubes = observable.map({});
  @observable segmentParams = {
    scale: 2.0,
  };

  constructor(api) {
    this.api = api;

    this.api.onTubeGeneratorChange((result) => {
      const [tube] = result;
      if (!this.tubes.has(tube.id)) {
        console.warn('Received untracked tube result????');
      }
      this.updateTube(tube);
    });
  }

  segmentTube(coords) {
    return this.api.generateTube(coords, this.segmentParams)
      .then((tube) => {
        this.addTube(tube);
      });
  }

  @action('updateSegmentParams')
  updateSegmentParams(newParams) {
    Object.assign(this.segmentParams, newParams);
  }

  @action('addTube')
  addTube(tube) {
    this.tubes.set(tube.id, Object.assign(tube, {
      visible: true,
    }));
  }

  @action('updateTube')
  updateTube(tube) {
    if (tube.mesh) {
      // we create a new tube object when updating
      this.tubes.set(tube.id, Object.assign({}, this.tubes.get(tube.id), tube));
    } else {
      this.tubes.delete(tube.id);
    }
  }
}

/*
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

// TODO delete all children of current tube
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
      color,
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
      api.addEventListener('segment', ({ result: tube }) => store.dispatch(updateTube(tube)));
      break;

    case 'loadTubes':
      api.loadTubes()
        .then(tubes => store.dispatch(addTubeBulk(tubes)));
      break;

    case 'setTubeColor': {
      api.setTubeColor(...action.args);
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

const data = () => ({
  tubeOrder: [],
  tubes: {},
  selection: {
    keys: [],
    rows: [],
  },
});
export default data;
*/
