import ColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import Store from './stores';

export const DEFAULT_SCALAR_OPACITY = 15;

export const ColorPresets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

export default class VolumeRenderStore extends Store {
  constructor() {
    super();
    this.privateData = {
      scalarOpacity: DEFAULT_SCALAR_OPACITY,
      colorMap: ColorPresets[0],
      transferFunctionWidget: null,
    };
  }

  get data() {
    return this.privateData;
  }

  set scalarOpacity(value) {
    this.privateData.scalarOpacity = value;
    this.update();
  }

  set colorMap(map) {
    this.privateData.colorMap = map;
    this.update();
  }

  set transferFunctionWidget(widget) {
    this.privateData.transferFunctionWidget = widget;
    this.update();
  }
}
