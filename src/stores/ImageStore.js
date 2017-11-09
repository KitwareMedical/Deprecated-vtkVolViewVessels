import Store from './stores';

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
