import React from 'react';
import PropTypes from 'prop-types';

import { Tabs } from 'antd';

import { connectAction } from '../state';
import style from '../Tube.mcss';

import ControllableSliceView from './ControllableSliceView';
import ControllableVolumeView from './ControllableVolumeView';
import Info from './Info';
import SegmentControls from './SegmentControls';
import TubeTreeView from './TubeTreeView';
import PiecewiseGaussianWidget from './PiecewiseGaussianWidget';
// import Messages from './Messages';
import { loadImage } from '../stores/ImageStore';
import { addTube, loadTubes, listenForTubes } from '../stores/TubeStore';

const TabPane = Tabs.TabPane;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.disconnects = [];
  }

  componentDidMount() {
    const { stores: { imageStore, segmentStore, tubeStore } } = this.props;

    connectAction(segmentStore, 'segmentedTube', tubeStore, addTube);

    imageStore.dispatch(loadImage());
    tubeStore.dispatch(loadTubes());
    tubeStore.dispatch(listenForTubes());
  }

  render() {
    const { stores } = this.props;

    return (
      <div className={style.reactRoot}>
        <div className={[style.vtkViewer, style.horizontalContainer, style.itemStretch].join(' ')}>
          <ControllableSliceView stores={stores} />
          <ControllableVolumeView stores={stores} />
        </div>
        <Tabs type="card">
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
            <PiecewiseGaussianWidget stores={stores} />
          </TabPane>
        </Tabs>
        { /*
        <Messages stores={stores} />
        */ }
      </div>
    );
  }
}

App.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default App;
