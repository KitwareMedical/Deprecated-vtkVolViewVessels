import ColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

export const DEFAULT_SCALAR_OPACITY = 15;

export const ColorPresets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

export const setScalarOpacity = scalarOpacity => data => ({
  ...data,
  scalarOpacity,
});

export const setColorMap = name => data => ({
  ...data,
  colorMap: ColorPresets.find(preset => preset.Name === name),
});

export const setTransferFunctionWidget = transferFunctionWidget => data => ({
  ...data,
  transferFunctionWidget,
});

export const setVolumeVisibility = volumeVisible => data => ({
  ...data,
  volumeVisible,
});

const data = () => ({
  colorMap: ColorPresets[0],
  scalarOpacity: DEFAULT_SCALAR_OPACITY,
  transferFunctionWidget: null,
  volumeVisible: true,
});
export default data;
