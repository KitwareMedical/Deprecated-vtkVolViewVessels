import { render } from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import style from './Tube.mcss';

import mode from './mode';

import SliceViewer from './ui/SliceViewer';
import VolumeViewer from './ui/VolumeViewer';
import TubeController from './ui/TubeController';

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
    this.volumeViewer.setPiecewiseWidgetContainer(this.tubeController.piecewiseEditorContainer);
    this.props.mode.run(this.startApplication.bind(this), this.stopApplication.bind(this));
  }

  startApplication(dataManager) {
    this.dataManager = dataManager;
    // We are ready to talk to the server...
    dataManager.ITKTube.getVolumeData().then((dataDescription) => {
      const values = new window[dataDescription.typedArray](dataDescription.scalars);
      const dataArray = vtkDataArray.newInstance({ name: 'Scalars', values });
      delete dataDescription.scalars;
      delete dataDescription.typedArray;
      const imageData = vtkImageData.newInstance(dataDescription);
      imageData.getPointData().setScalars(dataArray);

      const resizeHandler = macro.debounce(() => {
        [this.sliceViewer, this.volumeViewer, this.tubeController].forEach(e => e.resize());
      }, 50);
      // Register window resize handler so workbench redraws when browser is resized
      window.onresize = resizeHandler;

      this.setState((prevState, props) => ({ imageData }));
    });

    this.subscription = dataManager.ITKTube.onTubeGeneratorChange((tubeItem_) => {
      // TODO figure out why remote sends as array
      let tubeItem = tubeItem_;
      if (tubeItem instanceof Array) {
        tubeItem = tubeItem[0];
      }

      if (tubeItem.mesh) {
        this.setState((prevState, props) => ({ tubes: [...this.state.tubes, tubeItem] }));
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
      <div>
        <div className={[style.horizontalContainer, style.itemStretch].join(' ')}>
          <SliceViewer
            ref={(r) => { this.sliceViewer = r; }}
            imageData={this.state.imageData}
            onPickIJK={(i, j, k) => this.segmentTube(i, j, k)}
          />
          <VolumeViewer ref={(r) => { this.volumeViewer = r; }} imageData={this.state.imageData} tubes={this.state.tubes} />
        </div>
        <TubeController ref={(r) => { this.tubeController = r; }} tubes={this.state.tubes} />
      </div>
    );
  }
}

App.propTypes = {
  mode: PropTypes.object.isRequired,
};

render(<App mode={mode.local} />, document.querySelector('.content'));
// render(<App modeInit={mode.remote} />, document.querySelector('.content'));
