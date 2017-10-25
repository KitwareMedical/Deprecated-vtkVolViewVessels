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

  setTubeVisibility(id, visible) {
    const tubes = this.state.tubes.map((tube) => {
      if (tube.id === id) {
        tube.visible = visible;
      }
      return tube;
    });
    this.volumeViewer.setTubeVisibility(id, visible);
    this.setState((prevState, props) => ({ tubes }));
  }

  deleteTube(tubeId) {
    this.dataManager.ITKTube.deleteTube(tubeId).then(() => {
      const tubes = this.state.tubes.filter(tube => tube.id !== tubeId);
      this.setState((prevState, props) => ({ tubes }));
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

    this.subscription = dataManager.ITKTube.onTubeGeneratorChange((tubeItem_) => {
      // TODO figure out why remote sends as array
      let tubeItem = tubeItem_;
      if (tubeItem instanceof Array) {
        tubeItem = tubeItem[0];
      }

      if (tubeItem.mesh) {
        // set tube visibility to on by default
        tubeItem.visible = true;

        this.setState((prevState, props) => ({ tubes: [...this.state.tubes, tubeItem] }));
      }
    });

    const resizeHandler = macro.debounce(() => {
      [this.sliceViewer, this.volumeViewer, this.tubeController].forEach(e => e.resize());
    }, 50);
    // Register window resize handler so workbench redraws when browser is resized
    window.onresize = resizeHandler;
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
        <TubeController
          ref={(r) => { this.tubeController = r; }}
          tubes={this.state.tubes}
          onSetTubeVisibility={(id, visible) => this.setTubeVisibility(id, visible)}
          onDeleteTube={id => this.deleteTube(id)}
        />
      </div>
    );
  }
}

App.propTypes = {
  mode: PropTypes.object.isRequired,
};

render(<App mode={mode.local} />, document.querySelector('.content'));
// render(<App modeInit={mode.remote} />, document.querySelector('.content'));
