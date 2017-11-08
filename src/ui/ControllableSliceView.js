import React from 'react';
import PropTypes from 'prop-types';

import connect from '../state';

import SliceView from './SliceView';
import SliceControls from './SliceControls';
import * as ImageActions from '../actions/ImageActions';

import style from '../Tube.mcss';

function ControllableSliceView({
  actions,
  dispatch,
  image,
  slicePosition,
  sliceMaximum,
  sliceMode,
}) {
  return (
    <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
      <SliceView
        imageData={image}
        sliceMode={sliceMode}
        slice={slicePosition}
      />
      <SliceControls
        slice={slicePosition}
        sliceMax={sliceMaximum}
        onSliceChange={slice => dispatch(actions.setSlice, slice)}
      />
    </div>
  );
}

ControllableSliceView.propTypes = {
  image: PropTypes.object,
  slicePosition: PropTypes.number,
  sliceMaximum: PropTypes.number,
  sliceMode: PropTypes.number,

  actions: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

ControllableSliceView.defaultProps = {
  image: null,
  slicePosition: 0,
  sliceMaximum: 1,
  sliceMode: 2,
};

export default connect(ControllableSliceView, 'image',
  (stores, props) => ({
    image: stores.image.data.image,
    slicePosition: stores.image.data.slicePosition,
    sliceMaximum: stores.image.data.sliceMaximum,
    sliceMode: stores.image.data.sliceMode,
  }),
  () => ImageActions,
);
