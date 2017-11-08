import React from 'react';
import PropTypes from 'prop-types';

import ColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import VolumeView from './VolumeView';
import VolumeQuickControls from './VolumeQuickControls';

import style from '../Tube.mcss';

const DEFAULT_SCALAR_OPACITY = 15;

const presets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

export default class ControllableVolumeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scalarOpacity: DEFAULT_SCALAR_OPACITY,
      colorMap: presets[0],
    };
  }

  componentWillReceiveProps(props) {
    this.setState((prevState, _props) => ({ opacityValue: DEFAULT_SCALAR_OPACITY }));
  }

  get volumeView() {
    return this.volView;
  }

  render() {
    return (
      <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
        <VolumeView
          ref={(r) => { this.volView = r; }}
          imageData={this.props.imageData}
          scalarOpacity={this.state.scalarOpacity}
          colorMap={this.state.colorMap}
          tubes={this.props.tubes}
        />
        <VolumeQuickControls
          scalarOpacity={this.state.scalarOpacity}
          colorMap={this.state.colorMap}
          presets={presets}
          onScalarOpacityChange={scalarOpacity => this.setState({ scalarOpacity })}
          onColorMapChange={colorMapName => this.setState({ colorMap: presets.find(p => (p.Name === colorMapName)) })}
        />
      </div>
    );
  }
}

ControllableVolumeView.propTypes = {
  stores: PropTypes.object.isRequired,
  imageData: PropTypes.object,
  tubes: PropTypes.array,
};

ControllableVolumeView.defaultProps = {
  imageData: null,
  tubes: [],
};
