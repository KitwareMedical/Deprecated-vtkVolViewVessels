import React from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';

import style from '../Tube.mcss';

import SliceView from './SliceView';
import SliceControls from './SliceControls';

const SliceModeList = ['X', 'Y', 'Z'];

@observer
class Container extends React.Component {
  static propTypes = {
    stores: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      sliceMode: 2, // Z axis
      slice: 0,
      sliceMax: 1,
    };

    const { stores: { imageStore } } = props;

    this.disposer = reaction(
      () => imageStore.image,
      image => this.setSliceFromImage(image),
    );
  }

  setSliceFromImage(image) {
    const { sliceMode } = this.state;
    const sliceMax = image.getDimensions()[sliceMode] - 1;
    const slice = Math.ceil(sliceMax / 2);
    this.setState({ slice, sliceMax });
  }

  render() {
    const { stores: { imageStore, tubeStore } } = this.props;
    const { slice, sliceMax, sliceMode } = this.state;
    return (
      <ControllableSliceView
        image={imageStore.image}
        slice={slice}
        sliceMax={sliceMax}
        sliceMode={sliceMode}
        onPick={coords => tubeStore.segmentTube(coords)}
        onSliceChange={newSlice => this.setState({ slice: newSlice })}
        onSliceModeChange={mode => this.setState({ sliceMode: SliceModeList.indexOf(mode) })}
      />
    );
  }
}

export default Container;

function ControllableSliceView({
  image,
  slice, sliceMax, sliceMode,
  onPick,
  onSliceChange,
  onSliceModeChange,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <SliceView
        imageData={image}
        sliceMode={sliceMode}
        slice={slice}
        onPickIJK={coords => onPick(coords)}
      />
      <SliceControls
        slice={slice}
        sliceMax={sliceMax}
        sliceMode={SliceModeList[sliceMode]}
        sliceModeList={SliceModeList}
        onSliceChange={onSliceChange}
        onSliceModeChange={onSliceModeChange}
      />
    </div>
  );
}

ControllableSliceView.propTypes = {
  image: PropTypes.object,
  slice: PropTypes.number.isRequired,
  sliceMax: PropTypes.number.isRequired,
  sliceMode: PropTypes.number.isRequired,
  onPick: PropTypes.func,
  onSliceChange: PropTypes.func,
  onSliceModeChange: PropTypes.func,
};

ControllableSliceView.defaultProps = {
  image: null,
  onPick: () => {},
  onSliceChange: () => {},
  onSliceModeChange: () => {},
};
