import React from 'react';

import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

import style from '../Tube.mcss';

export default class PiecewiseGaussianWidget extends React.Component {
  constructor(props) {
    super(props);

    this.transferFunctionWidget = vtkPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [400, 168] });
    this.transferFunctionWidget.updateStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      histogramColor: 'rgba(100, 100, 100, 0.5)',
      strokeColor: 'rgb(0, 0, 0)',
      activeColor: 'rgb(255, 255, 255)',
      handleColor: 'rgb(50, 150, 50)',
      buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
      buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
      buttonStrokeColor: 'rgba(0, 0, 0, 1)',
      buttonFillColor: 'rgba(255, 255, 255, 1)',
      strokeWidth: 2,
      activeStrokeWidth: 3,
      buttonStrokeWidth: 1.5,
      handleWidth: 3,
      iconSize: 0,
      padding: 10,
    });
    this.transferFunctionWidget.addGaussian(0.5, 1.0, 0.5, 0.5, 0.4);
    this.transferFunctionWidget.bindMouseListeners();
    this.transferFunctionWidget.setSize(800, 300);
  }

  componentDidMount() {
    this.transferFunctionWidget.setContainer(this.container);
  }

  get vtkWidget() {
    return this.transferFunctionWidget;
  }

  render() {
    return (
      <div className={[style.verticalContainer, style.itemStretch, style.controller].join(' ')}>
        <div
          ref={(r) => { this.container = r; }}
        />
      </div>
    );
  }
}
