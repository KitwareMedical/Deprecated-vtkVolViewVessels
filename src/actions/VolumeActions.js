// TODO move this to a constants module
import { ColorPresets } from '../stores/VolumeRenderStore';

export function setScalarOpacity(stores, scalarOpacity) {
  stores.volumeRender.scalarOpacity = scalarOpacity;
}

export function setColorMap(stores, name) {
  stores.volumeRender.colorMap = ColorPresets.find(p => (p.Name === name));
}
