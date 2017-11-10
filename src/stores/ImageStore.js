import Store from './stores';

export function loadImage() {
}

export const setImage = image => (data, setData) => {
  const { sliceMode } = data;
  const sliceMax = image.getDimensions()[sliceMode] - 1;
  const slicePos = Math.ceil(sliceMax / 2);

  setData({
    ...data,

    image,
    slicePos,
    sliceMax,
  });
};

export const setSlicePos = (data, slicePos) => ({ ...data, slicePos });

// export default
export const data = () => ({
  image: null,

  // NOTE this is UI state, but is here because setting
  // the image affects UI state. Maybe I can move this
  // into the ControllableSliceView...
  sliceMode: 2, // Z axis
  slicePos: 0,
  sliceMax: 1,
});

export default class ImageStore extends Store {
  constructor() {
    super();
    this.privateData = {
      image: null,
      sliceMode: 2, // Z axis
      slicePosition: 0,
      sliceMaximum: 1,

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

  set data(image) {
    const { sliceMode } = this.privateData;
    const sliceMax = image.getDimensions()[sliceMode] - 1;
    const slice = Math.ceil(sliceMax / 2);

    Object.assign(this.privateData, {
      image,
      slicePosition: slice,
      sliceMaximum: sliceMax,
    });
    this.update();
  }

  set slicePosition(slice) {
    Object.assign(this.privateData, {
      slicePosition: slice,
    });
    this.update();
  }
}
