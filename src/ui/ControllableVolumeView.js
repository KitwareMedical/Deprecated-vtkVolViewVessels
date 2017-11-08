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
  scalarOpacity,
  colorMap,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <VolumeView
        imageData={image}
        scalarOpacity={scalarOpacity}
        colorMap={colorMap}
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
  scalarOpacity: PropTypes.number,
  colorMap: PropTypes.object.isRequired,
  // tubes: PropTypes.array,

  dispatch: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
};

ControllableVolumeView.defaultProps = {
  image: null,
  scalarOpacity: 0,
};

export default connect(ControllableVolumeView, ['image', 'volumeRender'],
  (stores, props) => ({
    image: stores.image.data.image,
    scalarOpacity: stores.volumeRender.data.scalarOpacity,
    colorMap: stores.volumeRender.data.colorMap,
  }),
  () => VolumeActions,
);
