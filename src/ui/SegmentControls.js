import React from 'react';
import PropTypes from 'prop-types';

import connect from '../state';
import style from '../Tube.mcss';

import LabeledSlider from './LabeledSlider';
import * as TubeActions from '../actions/TubeActions';

function SegmentControls({ actions, dispatch, scale }) {
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
        onChange={value => dispatch(actions.setSegmentScale, value)}
      />
    </div>
  );
}

SegmentControls.propTypes = {
  scale: PropTypes.number.isRequired,

  actions: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default connect(SegmentControls, 'segment',
  (stores, props) => ({
    scale: stores.segment.data.scale,
  }),
  () => TubeActions,
);
