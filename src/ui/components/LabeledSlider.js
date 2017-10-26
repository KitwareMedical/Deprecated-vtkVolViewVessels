import React from 'react';
import PropTypes from 'prop-types';

import { Slider } from 'antd';

/**
 * LabeledSlider
 *
 * Puts a customizable label next to a slider.
 *
 * Slider label defaults to the left, but can be set to the right or be visible on both sides.
 * The `label` prop has the signature `label(value, pos)`, where `value` is the value of the slider
 * and `pos` is the position of the label ('left', 'right').
 */
export default function LabeledSlider(props) {
  // TODO support vertical slider label
  const label = content => <span style={{ padding: '0 5px' }}>{content}</span>;
  return (
    <span style={{ display: 'flex', width: '100%' }}>
      { props.left || !props.right ? label(props.label(props.value, 'left')) : null }
      <Slider {...props} />
      { props.right ? label(props.label(props.value, 'right')) : null }
    </span>
  );
}

LabeledSlider.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.func,
  left: PropTypes.bool,
  right: PropTypes.bool,
};

LabeledSlider.defaultProps = {
  label: value => value,
  left: false,
  right: false,
};
