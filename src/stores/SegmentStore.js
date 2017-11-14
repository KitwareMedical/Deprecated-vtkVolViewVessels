import { Action } from '../state';

export const segmentTube = Action('segmentTube', coords => () => { /* noop */ });

export const setSegmentScale = scale => data => ({
  ...data,
  scale,
});

export const setSegmentedTube = segmentedTube => data => ({
  ...data,
  segmentedTube,
});

export const segmenter = api => (store, action) => {
  if (action.name === 'segmentTube') {
    const [coords] = action.args;
    api.segmentTube(coords, store.scale)
      .then(tube => store.dispatch(setSegmentedTube(tube)));
  }
};

const data = () => ({
  segmentedTube: null,
  scale: 2.0,
});
export default data;
