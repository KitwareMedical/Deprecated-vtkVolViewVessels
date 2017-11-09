export function setSegmentScale(stores, scale) {
  stores.segment.scale = scale;
}

export function changeJobCount(stores, delta) {
  // prevent jobs from ever entering the negative world
  stores.segment.jobs = Math.max(0, stores.segment.data.jobs + delta);
}

export function addTube(stores, tube) {
  Object.assign(tube, {
    visible: true,
    key: tube.id,
  });
  stores.tubes.addTube(tube);
}

export function updateTube(stores, tube) {
  if (stores.tubes.hasTube(tube)) {
    changeJobCount(stores, -1);
    stores.tubes.updateTube(tube);
  } else {
    addTube(stores, tube);
  }
}

export function segmentTube(stores, coord) {
  changeJobCount(stores, 1);
  stores.api.segmentTube(coord, stores.segment.data.scale)
    .then((tube) => {
      addTube(stores, tube);
    });
}

export function setTubeVisibility(stores, id, visibility) {
  console.log('setTubeVisibility');
}

export function setTubeColor(stores, id, color) {
  console.log('setTubeColor');
}

export function reparentSelectedTubes(stores, parentId) {
  console.log('reparentSelectedTubes');
}

export function deleteTube(stores, id) {
  console.log('deleteTube');
}

export function setSelection(stores, keys, records) {
  console.log('setSelection');
}
