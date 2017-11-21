import React from 'react';
import PropTypes from 'prop-types';

import style from '../Tube.mcss';

class PiecewiseGaussianWidget extends React.Component {
  componentDidMount() {
    const { transferFunctionWidget } = this.props;
    transferFunctionWidget.setContainer(this.container);
  }

  render() {
    return (
      <div className={[style.verticalContainer, style.itemStretch, style.controller].join(' ')}>
        <div ref={(r) => { this.container = r; }} />
      </div>
    );
  }
}

PiecewiseGaussianWidget.propTypes = {
  transferFunctionWidget: PropTypes.object.isRequired,
};

export default PiecewiseGaussianWidget;
