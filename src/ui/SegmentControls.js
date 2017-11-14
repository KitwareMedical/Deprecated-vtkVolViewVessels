import React from 'react';
import PropTypes from 'prop-types';

import { connectComponent } from '../state';
import style from '../Tube.mcss';

import { setSegmentScale } from '../stores/SegmentStore';

import LabeledSlider from './LabeledSlider';

function SegmentControls({ stores: { segmentStore }, scale }) {
  const sliderLabel = (value, pos) => (
    <span style={{ lineHeight: 2.5 }}><label className={style.label}>Scale: </label>{value.toFixed(2)}</span>
  );

  return (
    <div className={[style.itemStretch, style.border].join(' ')}>
      <LabeledSlider
        label={sliderLabel}
        className={style.slider}
        step={0.05}
        min={0}
        value={scale}
        max={20}
        onChange={value => segmentStore.dispatch(setSegmentScale(value))}
      />
    </div>
  );
}

SegmentControls.propTypes = {
  scale: PropTypes.number.isRequired,

  stores: PropTypes.object.isRequired,
};

export default connectComponent(SegmentControls, 'segmentStore', ({ segmentStore }, props) => ({
  scale: segmentStore.scale,
}));
