import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';

import style from '../Tube.mcss';

import LabeledSlider from './LabeledSlider';

function SegmentControls({ stores: { tubeStore } }) {
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
        value={tubeStore.segmentParams.scale}
        max={20}
        onChange={scale => tubeStore.updateSegmentParams({ scale })}
      />
    </div>
  );
}

SegmentControls.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default observer(SegmentControls);
