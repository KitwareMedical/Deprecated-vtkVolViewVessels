import React from 'react';
import PropTypes from 'prop-types';

import { connectComponent } from '../state';

import SliceView from './SliceView';
import SliceControls from './SliceControls';
// import * as ImageActions from '../actions/ImageActions';
// import * as TubeActions from '../actions/TubeActions';

import style from '../Tube.mcss';

function ControllableSliceView({
  image,
  slicePosition,
  sliceMaximum,
  sliceMode,
}) {
  console.log('controllable', image);
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <SliceView
        imageData={image}
        sliceMode={sliceMode}
        slice={slicePosition}
      />
      { /* onPickIJK={coords => dispatch(actions.segmentTube, coords)} */ }
      <SliceControls
        slice={slicePosition}
        sliceMax={sliceMaximum}
      />
      { /* onSliceChange={slice => dispatch(actions.setSlice, slice)} */ }
    </div>
  );
}

ControllableSliceView.propTypes = {
  image: PropTypes.object,
  slicePosition: PropTypes.number,
  sliceMaximum: PropTypes.number,
  sliceMode: PropTypes.number,
  stores: PropTypes.object.isRequired,
};

ControllableSliceView.defaultProps = {
  image: null,
  slicePosition: 0,
  sliceMaximum: 1,
  sliceMode: 2,
};

export default connectComponent(ControllableSliceView, 'imageStore',
  ({ imageStore }, props) => ({
    image: imageStore.image,
    slicePosition: imageStore.slicePos,
    sliceMaximum: imageStore.sliceMax,
    sliceMode: imageStore.sliceMode,
  }),
  {
  },
);
