import React from 'react';
import PropTypes from 'prop-types';

import VolumeView from './VolumeView';
import VolumeQuickControls from './VolumeQuickControls';

import connect from '../state';
import style from '../Tube.mcss';

// TODO move ColorPresets to some constants module
import { ColorPresets } from '../stores/ImageStore';

function ControllableVolumeView({
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
        onScalarOpacityChange={sc => this.setState({ sc })}
        onColorMapChange={colorMapName => this.setState({ colorMap: ColorPresets.find(p => (p.Name === colorMapName)) })}
      />
    </div>
  );
}

ControllableVolumeView.propTypes = {
  image: PropTypes.object,
  scalarOpacity: PropTypes.number,
  colorMap: PropTypes.object.isRequired,
  // tubes: PropTypes.array,
};

ControllableVolumeView.defaultProps = {
  image: null,
  scalarOpacity: 0,
};

export default connect(ControllableVolumeView, ['image'],
  (stores, props) => ({
    image: stores.image.data.image,
    scalarOpacity: stores.image.data.scalarOpacity,
    colorMap: stores.image.data.colorMap,
  }));
