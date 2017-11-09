import React from 'react';
import PropTypes from 'prop-types';

import VolumeView from './VolumeView';
import VolumeQuickControls from './VolumeQuickControls';

import connect from '../state';
import style from '../Tube.mcss';

// TODO move ColorPresets to some constants module
import { ColorPresets } from '../stores/VolumeRenderStore';
import * as VolumeActions from '../actions/VolumeActions';

function ControllableVolumeView({
  actions,
  dispatch,
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
        onScalarOpacityChange={value => dispatch(actions.setScalarOpacity, value)}
        onColorMapChange={name => dispatch(actions.setColorMap, name)}
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

  dispatch: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
};

ControllableVolumeView.defaultProps = {
  image: null,
  tubes: [],
  scalarOpacity: 0,
  transferFunctionWidget: null,
};

export default connect(ControllableVolumeView, ['image', 'tubes', 'volumeRender'],
  (stores, props, updated) => {
    switch (updated) {
      case 'image':
        return { image: stores.image.data.image };
      case 'tubes':
        return { tubes: stores.tubes.data.tubes.filter(tube => tube.mesh) };
      case 'volumeRender':
        return {
          scalarOpacity: stores.volumeRender.data.scalarOpacity,
          colorMap: stores.volumeRender.data.colorMap,
          transferFunctionWidget: stores.volumeRender.data.transferFunctionWidget,
        };
      default:
        // return the defaults, with the colorMap coming from the volumeRender store
        return Object.assign({ colorMap: stores.volumeRender.data.colorMap }, ControllableVolumeView.defaultProps);
    }
  },
  () => VolumeActions,
);
