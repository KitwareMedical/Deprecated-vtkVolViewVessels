import React from 'react';
import PropTypes from 'prop-types';

import { Select } from 'antd';

import LabeledSlider from './LabeledSlider';

import style from '../Tube.mcss';

const Option = Select.Option;

export default function SliceControls(props) {
  const { slice, sliceMax, sliceMode, sliceModeList, onSliceChange } = props;
  const modeList = sliceModeList.map(mode => <Option key={mode} value={mode}>{mode}</Option>);

  return (
    <div className={[style.horizontalContainer, style.controlLine].join(' ')}>
      <Select
        defaultValue={sliceMode}
        onChange={sliceModeName => props.onSliceModeChange(sliceModeName)}
      >
        {modeList}
      </Select>
      <LabeledSlider
        className={[style.slider, style.itemStretch].join(' ')}
        label={(value, pos) => <span style={{ lineHeight: 2.5 }}><label className={style.label}>Slice: </label>{value}</span>}
        min={0}
        value={slice}
        max={sliceMax}
        onChange={value => onSliceChange(value)}
      />
    </div>
  );
}

SliceControls.propTypes = {
  slice: PropTypes.number.isRequired,
  sliceMax: PropTypes.number.isRequired,
  sliceMode: PropTypes.string.isRequired,
  sliceModeList: PropTypes.array.isRequired,
  onSliceChange: PropTypes.func,
  onSliceModeChange: PropTypes.func,
};

SliceControls.defaultProps = {
  onSliceChange: () => {},
  onSliceModeChange: () => {},
};
