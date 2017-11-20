import React from 'react';
import PropTypes from 'prop-types';

import { connectComponent } from '../state';

import SliceView from './SliceView';
import SliceControls from './SliceControls';
// import * as ImageActions from '../actions/ImageActions';
// import * as TubeActions from '../actions/TubeActions';
import { setSlicePos, setSliceMode } from '../stores/ImageStore';
import { segmentTube } from '../stores/SegmentStore';

import style from '../Tube.mcss';

const SliceModeList = ['X', 'Y', 'Z'];

function ControllableSliceView({
  stores: { imageStore, segmentStore },
  image,
  scalarRange,
  slicePosition,
  sliceMaximum,
  sliceMode,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <SliceView
        imageData={image}
        imageScalarRange={scalarRange}
        sliceMode={sliceMode}
        slice={slicePosition}
        onPickIJK={coords => segmentStore.dispatch(segmentTube(coords))}
      />
      <SliceControls
        slice={slicePosition}
        sliceMax={sliceMaximum}
        sliceMode={SliceModeList[sliceMode]}
        sliceModeList={SliceModeList}
        onSliceChange={slice => imageStore.dispatch(setSlicePos(slice))}
        onSliceModeChange={name => imageStore.dispatch(setSliceMode(SliceModeList.indexOf(name)))}
      />
    </div>
  );
}

ControllableSliceView.propTypes = {
  image: PropTypes.object,
  scalarRange: PropTypes.array,
  slicePosition: PropTypes.number,
  sliceMaximum: PropTypes.number,
  sliceMode: PropTypes.number,
  stores: PropTypes.object.isRequired,
};

ControllableSliceView.defaultProps = {
  image: null,
  scalarRange: [0, 1],
  slicePosition: 0,
  sliceMaximum: 1,
  sliceMode: 2,
};

export default connectComponent(ControllableSliceView, 'imageStore',
  ({ imageStore }, props) => ({
    image: imageStore.image,
    scalarRange: imageStore.scalarRange,
    slicePosition: imageStore.slicePos,
    sliceMaximum: imageStore.sliceMax,
    sliceMode: imageStore.sliceMode,
  }),
);
