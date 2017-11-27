import React from 'react';
import PropTypes from 'prop-types';
import { Tabs } from 'antd';

import style from '../Tube.mcss';
import vtkFasterPiecewiseGaussianWidget from '../util/FasterPiecewiseGaussianWidget';

import ControllableSliceView from './ControllableSliceView';
import ControllableVolumeView from './ControllableVolumeView';
import Info from './Info';
import SegmentControls from './SegmentControls';
import TubeTreeView from './TubeTreeView';
import PiecewiseGaussianWidget from './PiecewiseGaussianWidget';
import Messages from './Messages';

const TabPane = Tabs.TabPane;

class App extends React.Component {
  componentWillMount() {
    this.transferFunctionWidget = vtkFasterPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [400, 168] });
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

  render() {
    const { stores } = this.props;
    return (
      <div className={style.reactRoot}>
        <div className={[style.vtkViewer, style.horizontalContainer, style.itemStretch].join(' ')}>
          <ControllableSliceView stores={stores} />
          <ControllableVolumeView
            stores={stores}
            transferFunctionWidget={this.transferFunctionWidget}
          />
        </div>
        <Tabs style={{ marginTop: '10px' }} type="card">
          <TabPane forceRender key="info" tab="Info">
            <Info stores={stores} />
          </TabPane>
          <TabPane forceRender key="tubes" tab="Tubes">
            <div className={[style.horizontalContainer, style.controller].join(' ')}>
              <SegmentControls stores={stores} />
              <TubeTreeView stores={stores} />
            </div>
          </TabPane>
          <TabPane forceRender key="volume" tab="Volume">
            <PiecewiseGaussianWidget transferFunctionWidget={this.transferFunctionWidget} />
          </TabPane>
        </Tabs>
        <Messages stores={stores} />
      </div>
    );
  }
}

App.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default App;
