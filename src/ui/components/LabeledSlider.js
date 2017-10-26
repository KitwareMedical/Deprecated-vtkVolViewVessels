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
export default class LabeledSlider extends Slider {
  render() {
    // TODO support vertical slider label
    const label = pos => <span>{this.props.label(this.props.value, pos)}</span>;
    return (
      <span style={{ display: 'flex', width: '100%' }}>
        { this.props.left || !this.props.right ? label('left') : null }
        <Slider {...this.props} />
        { this.props.right ? label('right') : null }
      </span>
    );
  }
}

LabeledSlider.propTypes = {
  label: PropTypes.func,
  onChange: PropTypes.func,
  left: PropTypes.bool,
  right: PropTypes.bool,
};

LabeledSlider.defaultProps = {
  label: value => value,
  onChange: () => {},
  left: false,
  right: false,
};
