import React from 'react';
import PropTypes from 'prop-types';

import SliceView from './SliceView';
import SliceControls from './SliceControls';

import style from '../Tube.mcss';

export default class ControllableSliceView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sliceMode: 2, // Z axis
      slice: 0,
      sliceMax: 1,
    };
  }

  componentWillReceiveProps(props) {
    const sliceMax = props.imageData.getDimensions()[this.state.sliceMode] - 1;
    const slice = Math.ceil(sliceMax / 2);
    this.setState(({ sliceMax, slice }));
  }

  render() {
    return (
      <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
        <SliceView
          imageData={this.props.imageData}
          sliceMode={this.state.sliceMode}
          slice={this.state.slice}
          onPickIJK={this.props.onPickIJK}
        />
        <SliceControls
          slice={this.state.slice}
          sliceMax={this.state.sliceMax}
          onSliceChange={slice => this.setState({ slice })}
        />
      </div>
    );
  }
}

ControllableSliceView.propTypes = {
  onPickIJK: PropTypes.func,
  imageData: PropTypes.object,
};

ControllableSliceView.defaultProps = {
  onPickIJK: null,
  imageData: null,
};
