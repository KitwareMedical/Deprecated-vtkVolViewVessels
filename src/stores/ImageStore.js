import { Action } from '../state';
import wrapDataState, { setLoading, clearLoading, setError } from './DataStateStore';

export const loadImage = Action('loadImage', filename => () => { /* noop */ });

export const setImage = Action('setImage', image => (data, setData) => {
  const { sliceMode } = data;
  const sliceMax = image.getDimensions()[sliceMode] - 1;
  const slicePos = Math.ceil(sliceMax / 2);

  setData({
    ...data,

    image,
    slicePos,
    sliceMax,
  });
});

export const setSlicePos = slicePos => data => ({ ...data, slicePos });

export const imageLoader = api => (store, action) => {
  if (action.name === 'loadImage') {
    store.dispatch(setLoading());

    api.loadImage(...action.args)
      .then((image) => {
        store.dispatch(clearLoading());
        store.dispatch(setImage(image));
      })
      .catch(reason => store.dispatch(setError('Failed to load file')));
  }
};

const data = () => wrapDataState({
  image: null,

  // NOTE this is UI state, but is here because setting
  // the image affects UI state. Maybe I can move this
  // into the ControllableSliceView...
  sliceMode: 2, // Z axis
  slicePos: 0,
  sliceMax: 1,
});
export default data;
