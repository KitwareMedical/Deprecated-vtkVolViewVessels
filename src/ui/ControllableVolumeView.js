import React from 'react';
import PropTypes from 'prop-types';

import VolumeView from './VolumeView';
import VolumeQuickControls from './VolumeQuickControls';

import { connectComponent } from '../state';
import style from '../Tube.mcss';

// TODO move ColorPresets to some constants module
import { ColorPresets } from '../stores/VolumeStore';

function ControllableVolumeView({
  image,
  tubes,
  scalarOpacity,
  colorMap,
  transferFunctionWidget,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <VolumeView
        imageData={image}
        tubes={tubes}
        scalarOpacity={scalarOpacity}
        colorMap={colorMap}
        transferFunctionWidget={transferFunctionWidget}
      />
      <VolumeQuickControls
        scalarOpacity={scalarOpacity}
        colorMap={colorMap}
        presets={ColorPresets}
      />
      { /* onScalarOpacityChange={value => dispatch(actions.setScalarOpacity, value)} */ }
      { /* onColorMapChange={name => dispatch(actions.setColorMap, name)} */ }
    </div>
  );
}

ControllableVolumeView.propTypes = {
  image: PropTypes.object,
  tubes: PropTypes.array,
  scalarOpacity: PropTypes.number,
  transferFunctionWidget: PropTypes.object,
  colorMap: PropTypes.object.isRequired,
};

ControllableVolumeView.defaultProps = {
  image: null,
  tubes: [],
  scalarOpacity: 0,
  transferFunctionWidget: null,
};

export default connectComponent(ControllableVolumeView, ['imageStore', 'tubeStore', 'volumeStore'],
  ({ imageStore, tubeStore, volumeStore }, props, updated) => {
    switch (updated) {
      case 'imageStore':
        return { image: imageStore.image };
      case 'tubeStore':
        return { tubes: tubeStore.tubeOrder.map(id => tubeStore.tubes[id]).filter(tube => tube.mesh) };
      case 'volumeStore':
        return {
          scalarOpacity: volumeStore.scalarOpacity,
          colorMap: volumeStore.colorMap,
          transferFunctionWidget: volumeStore.transferFunctionWidget,
        };
      default:
        // return the defaults, with the colorMap coming from the volumeRender store
        return { colorMap: volumeStore.colorMap, ...ControllableVolumeView.defaultProps };
    }
  },
);
