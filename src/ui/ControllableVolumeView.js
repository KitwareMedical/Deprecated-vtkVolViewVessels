import React from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';

import ColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import style from '../Tube.mcss';

import VolumeView from './VolumeView';
import VolumeQuickControls from './VolumeQuickControls';

const ColorPresets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

const DEFAULT_OPACITY = 15;

@observer
class Container extends React.Component {
  static propTypes = {
    stores: PropTypes.object.isRequired,
    transferFunctionWidget: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = this.initialState;

    const { stores: { imageStore } } = props;

    // reset state every time the image changes
    this.disposer = reaction(
      () => imageStore.image,
      () => this.setState(this.initialState),
    );
  }

  get initialState() {
    return {
      opacity: DEFAULT_OPACITY,
      colorMap: ColorPresets[0],
      visible: true,
    };
  }

  render() {
    const { opacity, colorMap, visible } = this.state;
    const {
      stores: { imageStore, tubeStore },
      transferFunctionWidget,
    } = this.props;

    const tubes = tubeStore.tubes.values().filter(tube => tube.mesh);

    return (
      <ControllableVolumeView
        image={imageStore.image}
        tubes={tubes}
        transferFunctionWidget={transferFunctionWidget}
        opacity={opacity}
        colorMap={colorMap}
        visible={visible}
        onScalarOpacityChange={value => this.setState({ opacity: value })}
        onColorMapChange={mapName => this.setState({ colorMap: ColorPresets.find(map => map.Name === mapName) })}
        onVisibilityChange={v => this.setState({ visible: v })}
      />
    );
  }
}

export default Container;

function ControllableVolumeView({
  image,
  tubes,
  opacity,
  colorMap,
  transferFunctionWidget,
  visible,
  onScalarOpacityChange,
  onColorMapChange,
  onVisibilityChange,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <VolumeView
        imageData={image}
        tubes={tubes}
        visible={visible}
        scalarOpacity={opacity}
        colorMap={colorMap}
        transferFunctionWidget={transferFunctionWidget}
      />
      <VolumeQuickControls
        scalarOpacity={opacity}
        colorMap={colorMap}
        presets={ColorPresets}
        visible={visible}
        onScalarOpacityChange={onScalarOpacityChange}
        onColorMapChange={onColorMapChange}
        onVisibilityChange={onVisibilityChange}
      />
    </div>
  );
}

ControllableVolumeView.propTypes = {
  image: PropTypes.object,
  tubes: PropTypes.array,
  opacity: PropTypes.number.isRequired,
  transferFunctionWidget: PropTypes.object.isRequired,
  colorMap: PropTypes.object.isRequired,
  visible: PropTypes.bool.isRequired,
  onScalarOpacityChange: PropTypes.func,
  onColorMapChange: PropTypes.func,
  onVisibilityChange: PropTypes.func,
};

ControllableVolumeView.defaultProps = {
  image: null,
  tubes: [],
  onScalarOpacityChange: () => {},
  onColorMapChange: () => {},
  onVisibilityChange: () => {},
};
