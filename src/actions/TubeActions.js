export function setSegmentScale(stores, scale) {
  stores.segment.scale = scale;
}

export function setLoading(stores, state) {
  stores.tubes.loading = state;
}

export function changeJobCount(stores, delta) {
  // prevent jobs from ever entering the negative world
  stores.segment.jobs = Math.max(0, stores.segment.data.jobs + delta);
}

export function addTubes(stores, tubes) {
  tubes.forEach((tube) => {
    Object.assign(tube, {
      visible: true,
      key: tube.id,
    });
  });
  stores.tubes.addTubes(tubes);
}

export function updateTube(stores, tube) {
  if (stores.tubes.hasTube(tube)) {
    changeJobCount(stores, -1);
    stores.tubes.updateTube(tube);
  } else {
    addTubes(stores, [tube]);
  }
}

export function loadTubes(stores) {
  setLoading(stores, true);
  stores.api.loadTubes()
    .then((tubes) => {
      setLoading(stores, false);
      addTubes(stores, tubes);
    });
}

export function segmentTube(stores, coord) {
  changeJobCount(stores, 1);
  stores.api.segmentTube(coord, stores.segment.data.scale)
    .then((tube) => {
      addTubes(stores, [tube]);
    });
}

export function setTubeVisibility(stores, id, visibility) {
  const tube = stores.tubes.data.tubes.find(t => t.id === id);
  if (tube) {
    tube.visible = visibility;
    stores.tubes.updateTube(tube);
  }
}

export function setTubeColor(stores, id, color) {
  const normColor = [color.r / 255, color.g / 255, color.b / 255];
  stores.api.setTubeColor(id, normColor)
    .then((resp) => {
      if (resp.status === 'ok') {
        const tubes = stores.tubes.data.tubes;
        const idx = tubes.findIndex(tube => tube.id === id);
        if (idx > -1) {
          tubes[idx].color = normColor;
          stores.tubes.tubes = tubes;
        } else {
          // set error
          console.error(`Could not find tube ${id} to set color`);
        }
      } else {
        // set error
        console.error(`Could not set tube ${id} color`);
      }
    });
  console.log('setTubeColor');
}

export function reparentSelectedTubes(stores, parentId) {
  console.log('reparentSelectedTubes');
}

export function deleteTube(stores, id) {
  stores.api.deleteTube(id)
    .then((resp) => {
      if (resp.status === 'ok') {
        // delete tube
        stores.tubes.tubes = stores.tubes.data.tubes.filter(tube => tube.id !== id);
      }
    });
  console.log('deleteTube');
}

export function setSelection(stores, keys, records) {
  stores.tubes.setSelection(keys, records);
  console.log('setSelection');
}
