import React from 'react';
import PropTypes from 'prop-types';

import { Select } from 'antd';

import LabeledSlider from './LabeledSlider';
import style from '../Tube.mcss';

const Option = Select.Option;

export default function VolumeQuickControls(props) {
  const presets = props.presets.map(p => <Option key={p.Name} value={p.Name}>{p.Name}</Option>);

  return (
    <div className={[style.horizontalContainer, style.controlLine].join(' ')}>
      <LabeledSlider
        className={[style.slider, style.itemStretch].join(' ')}
        label={(value, pos) => <span style={{ lineHeight: 2.5 }}><label className={style.label}>Scalar Opacity: </label>{value}</span>}
        min={0}
        value={props.scalarOpacity}
        max={100}
        onChange={value => props.onScalarOpacityChange(value)}
      />
      <Select
        className={style.itemStretch}
        defaultValue={props.colorMap.Name}
        onChange={colorMapName => props.onColorMapChange(colorMapName)}
      >
        {presets}
      </Select>

    </div>
  );
}

VolumeQuickControls.propTypes = {
  scalarOpacity: PropTypes.number.isRequired,
  colorMap: PropTypes.object.isRequired,
  presets: PropTypes.array,
  onScalarOpacityChange: PropTypes.func,
  onColorMapChange: PropTypes.func,
};

VolumeQuickControls.defaultProps = {
  presets: [],
  onScalarOpacityChange: () => {},
  onColorMapChange: () => {},
};
