import React from 'react';
import PropTypes from 'prop-types';

import connect from '../state';

import SliceView from './SliceView';
import SliceControls from './SliceControls';

import style from '../Tube.mcss';

class ControllableSliceView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    const { image, slicePosition, sliceMaximum } = this.props;
    return (
      <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
        <SliceView
          imageData={image}
          sliceMode={2} // Z axis
          slice={slicePosition}
          onPickIJK={this.props.onPickIJK}
        />
        <SliceControls
          slice={slicePosition}
          sliceMax={sliceMaximum}
          onSliceChange={slice => this.setState({ slice })}
        />
      </div>
    );
  }
}

ControllableSliceView.propTypes = {
  image: PropTypes.object,
  slicePosition: PropTypes.number,
  sliceMaximum: PropTypes.number,
  onPickIJK: PropTypes.func,

  // stores: PropTypes.object.isRequired,
  // actions: PropTypes.object.isRequired,
};

ControllableSliceView.defaultProps = {
  image: null,
  slicePosition: 0,
  sliceMaximum: 1,
  onPickIJK: null,
};

export default connect(ControllableSliceView, 'image', (stores, props) => ({
  image: stores.image.data.image,
  slicePosition: stores.image.data.slicePosition,
  sliceMaximum: stores.image.data.sliceMaximum,
}));
