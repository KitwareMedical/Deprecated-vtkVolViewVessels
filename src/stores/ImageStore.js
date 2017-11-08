import ColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import Store from './stores';

export const DEFAULT_SCALAR_OPACITY = 15;

export const ColorPresets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

export default class ImageStore extends Store {
  constructor() {
    super();
    this.privateData = {
      image: null,
      sliceMode: 2, // Z axis
      slicePosition: 0,
      sliceMaximum: 1,
      scalarOpacity: DEFAULT_SCALAR_OPACITY,
      colorMap: ColorPresets[0],
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
