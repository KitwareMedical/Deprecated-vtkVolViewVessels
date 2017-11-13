import ColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

export const DEFAULT_SCALAR_OPACITY = 15;

export const ColorPresets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

export const setTransferFunctionWidget = transferFunctionWidget => data => ({
  ...data,
  transferFunctionWidget,
});

const data = () => ({
  colorMap: ColorPresets[0],
  scalarOpacity: DEFAULT_SCALAR_OPACITY,
  transferFunctionWidget: null,
});
export default data;
