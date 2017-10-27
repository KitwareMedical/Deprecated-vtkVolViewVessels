import React from 'react';
import PropTypes from 'prop-types';

import LabeledSlider from './components/LabeledSlider';

import style from '../Tube.mcss';

export default function SliceControls(props) {
  return (
    <div>
      <LabeledSlider
        className={style.slider}
        label={(value, pos) => <span style={{ lineHeight: 2.5 }}><label className={style.label}>Slice: </label>{value}</span>}
        min={0}
        value={props.slice}
        max={props.sliceMax}
        onChange={value => props.onSliceChange(value)}
      />
    </div>
  );
}

SliceControls.propTypes = {
  slice: PropTypes.number.isRequired,
  sliceMax: PropTypes.number.isRequired,
  onSliceChange: PropTypes.func,
};

SliceControls.defaultProps = {
  onSliceChange: () => {},
};
