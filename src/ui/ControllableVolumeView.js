import React from 'react';
import PropTypes from 'prop-types';

import VolumeView from './VolumeView';
import VolumeQuickControls from './VolumeQuickControls';

import { connectComponent } from '../state';
import style from '../Tube.mcss';

// TODO move ColorPresets to some constants module
import { ColorPresets, setScalarOpacity, setColorMap, setVolumeVisibility } from '../stores/VolumeStore';

// TODO move scalarOpacity and colorMap to internal state, since nothing else
// uses that state.
function ControllableVolumeView({
  stores: { volumeStore },
  image,
  tubes,
  scalarOpacity,
  colorMap,
  transferFunctionWidget,
  visible,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <VolumeView
        imageData={image}
        visible={visible}
        tubes={tubes}
        scalarOpacity={scalarOpacity}
        colorMap={colorMap}
        transferFunctionWidget={transferFunctionWidget}
      />
      <VolumeQuickControls
        scalarOpacity={scalarOpacity}
        colorMap={colorMap}
        presets={ColorPresets}
        visible={visible}
        onScalarOpacityChange={value => volumeStore.dispatch(setScalarOpacity(value))}
        onColorMapChange={name => volumeStore.dispatch(setColorMap(name))}
        onVisibilityChange={v => volumeStore.dispatch(setVolumeVisibility(v))}
      />
    </div>
  );
}

ControllableVolumeView.propTypes = {
  image: PropTypes.object,
  tubes: PropTypes.array,
  scalarOpacity: PropTypes.number,
  transferFunctionWidget: PropTypes.object,
  colorMap: PropTypes.object.isRequired,
  visible: PropTypes.bool,

  stores: PropTypes.object.isRequired,
};

ControllableVolumeView.defaultProps = {
  image: null,
  tubes: [],
  scalarOpacity: 0,
  transferFunctionWidget: null,
  visible: true,
};

export default connectComponent(ControllableVolumeView, ['imageStore', 'tubeStore', 'volumeStore'],
  ({ imageStore, tubeStore, volumeStore }, props, updated, changedKeys) => {
    switch (updated) {
      case 'imageStore':
        if (changedKeys.includes('image')) {
          return { image: imageStore.image };
        }
        return null;
      case 'tubeStore':
        return { tubes: tubeStore.tubeOrder.map(id => tubeStore.tubes[id]).filter(tube => tube.mesh) };
      case 'volumeStore':
        return {
          scalarOpacity: volumeStore.scalarOpacity,
          colorMap: volumeStore.colorMap,
          transferFunctionWidget: volumeStore.transferFunctionWidget,
          visible: volumeStore.volumeVisible,
        };
      default:
        // return the defaults, with the colorMap coming from the volumeRender store
        return { colorMap: volumeStore.colorMap, ...ControllableVolumeView.defaultProps };
    }
  },
);
