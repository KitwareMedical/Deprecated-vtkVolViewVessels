import React from 'react';
import PropTypes from 'prop-types';

import { Popover, Button } from 'antd';
import { GithubPicker as ColorPicker } from 'react-color';

export const PickableColors = [
  '#FF0000',
  '#FF5500',
  '#FFAA00',
  '#FFFF00',
  '#AAFF00',
  '#55FF00',
  '#00FF00',
  '#00FF55',
  '#00FFAA',
  '#00FFFF',
  '#00AAFF',
  '#0055FF',
  '#0000FF',
];

/**
 * PopupColorPicker
 *
 * Input color must be in array format [r, g, b], where all
 * components are float values between 0 and 255.
 */
export default class PopupColorPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  onColorChange(color) {
    this.props.onChange(color.rgb);
    this.setState({ visible: false });
  }

  render() {
    const [r, g, b] = this.props.color;
    return (
      <Popover
        content={
          <ColorPicker
            triangle="hide"
            colors={PickableColors}
            onChange={color => this.onColorChange(color)}
          />
        }
        trigger="click"
        visible={this.state.visible}
        onVisibleChange={visible => this.setState({ visible })}
      >
        <Button
          shape="circle"
          size="small"
          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
        >
          &nbsp;
        </Button>
      </Popover>
    );
  }
}

PopupColorPicker.propTypes = {
  color: PropTypes.array.isRequired,
  onChange: PropTypes.func,
};

PopupColorPicker.defaultProps = {
  onChange: () => {},
};
