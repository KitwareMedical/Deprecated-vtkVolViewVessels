import { render } from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

import { LocaleProvider, Tabs } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import style from './Tube.mcss';

import mode from './mode';

import ControllableSliceView from './ui/ControllableSliceView';
import ControllableVolumeView from './ui/ControllableVolumeView';
//  import VolumeViewer from './ui/VolumeViewer';
import TubeController from './ui/TubeController';
import PiecewiseGaussianWidget from './ui/PiecewiseGaussianWidget';

const TabPane = Tabs.TabPane;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageData: null,
      tubes: [],
    };

    this.subscription = null;
  }

  componentDidMount() {
    // this.volumeViewer.setPiecewiseWidgetContainer(this.tubeController.piecewiseEditorContainer);
    this.controllableVolumeView.volumeView.setTransferFunctionWidget(this.volumeTransferWidget.vtkWidget);
    this.props.mode.run(this.startApplication.bind(this), this.stopApplication.bind(this));
  }

  setTubeVisibility(id, visible) {
    const tubes = this.state.tubes.map((tube) => {
      if (tube.id === id) {
        tube.visible = visible;
      }
      return tube;
    });
    this.setState(({ tubes }));
  }

  deleteTube(tubeId) {
    this.dataManager.ITKTube.deleteTube(tubeId).then(() => {
      const tubes = this.state.tubes.filter(tube => tube.id !== tubeId);
      this.setState(({ tubes }));
    });
  }

  startApplication(dataManager) {
    this.dataManager = dataManager;
    // We are ready to talk to the server...
    dataManager.ITKTube.getVolumeData().then((dataDescription) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(dataDescription.scalars);

      reader.addEventListener('loadend', () => {
        const values = new window[dataDescription.typedArray](reader.result);
        const dataArray = vtkDataArray.newInstance({ name: 'Scalars', values });
        delete dataDescription.scalars;
        delete dataDescription.typedArray;
        const imageData = vtkImageData.newInstance(dataDescription);
        imageData.getPointData().setScalars(dataArray);

        this.setState((prevState, props) => ({ imageData }));
      });
    });

    dataManager.ITKTube.getTubes().then((tubes) => {
      tubes.forEach((tube, index) => { tubes[index].visible = true; });
      this.setState({ tubes });
    });

    this.subscription = dataManager.ITKTube.onTubeGeneratorChange((tubeItem_) => {
      // TODO figure out why remote sends as array
      let tubeItem = tubeItem_;
      if (tubeItem instanceof Array) {
        tubeItem = tubeItem[0];
      }

      if (tubeItem.mesh) {
        // set tube visibility to on by default
        tubeItem.visible = true;
        this.setState({ tubes: [...this.state.tubes, tubeItem] });
      }
    });
  }

  stopApplication() {
    if (this.subscription) {
      this.dataManager.ITKTube.unsubscribe();
    }
    //
    this.dataManager.exit(10);
  }

  segmentTube(i, j, k) {
    this.dataManager.ITKTube.generateTube(i, j, k, this.tubeController.scale);
  }

  render() {
    return (
      <div className={style.reactRoot}>
        <div className={[style.vtkViewer, style.horizontalContainer, style.itemStretch].join(' ')}>
          <ControllableSliceView
            imageData={this.state.imageData}
            onPickIJK={(i, j, k) => this.segmentTube(i, j, k)}
          />
          <ControllableVolumeView
            ref={(r) => { this.controllableVolumeView = r; }}
            imageData={this.state.imageData}
            tubes={this.state.tubes}
          />
        </div>
        <Tabs type="card">
          <TabPane forceRender key="tubes" tab="Tubes">
            <TubeController
              ref={(r) => { this.tubeController = r; }}
              tubes={this.state.tubes}
              onSetTubeVisibility={(id, visible) => this.setTubeVisibility(id, visible)}
              onDeleteTube={id => this.deleteTube(id)}
            />
          </TabPane>
          <TabPane forceRender key="volume" tab="Volume">
            <PiecewiseGaussianWidget ref={(r) => { this.volumeTransferWidget = r; }} />
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

App.propTypes = {
  mode: PropTypes.object.isRequired,
};

//  <App mode={mode.local} />
render(
  <LocaleProvider locale={enUS}>
    <App mode={mode.remote} />
  </LocaleProvider>,
  document.querySelector('.content'),
);
