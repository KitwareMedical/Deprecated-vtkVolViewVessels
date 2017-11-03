import { render } from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';

import { LocaleProvider, Tabs, Button, Modal, message as Message } from 'antd';
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
import RemoteFsExplorer from './ui/RemoteFsExplorer';

const TabPane = Tabs.TabPane;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      imageData: null,
      tubes: [],

      // ui
      fsExplorerOpen: false,
    };

    this.subscription = null;
  }

  componentDidMount() {
    // this.volumeViewer.setPiecewiseWidgetContainer(this.tubeController.piecewiseEditorContainer);
    this.controllableVolumeView.volumeView.setTransferFunctionWidget(this.volumeTransferWidget.vtkWidget);
    this.subscribeToServer();
    this.loadData();
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.props.dataManager.ITKTube.unsubscribe();
    }
    //
    this.props.dataManager.exit(10);
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

  prepareNewTubes(tubes) {
    return tubes.map(tube => Object.assign({ visible: true, key: tube.id }, tube));
  }

  deleteTube(tubeId) {
    this.props.dataManager.ITKTube.deleteTube(tubeId).then(() => {
      let newParent = -1;
      const tubes = [];
      this.state.tubes.forEach((tube) => {
        if (tube.id === tubeId) {
          newParent = tube.parent;
        } else {
          tubes.push(tube);
        }
      });

      // reparent any children to the deleted tube's parent
      tubes.forEach((tube) => {
        if (tube.parent === tubeId) {
          tube.parent = newParent;
        }
      });

      this.setState(({ tubes }));
    });
  }

  changeTubeColor(tubeId, color) {
    const normColor = [color.r / 255, color.g / 255, color.b / 255];
    this.props.dataManager.ITKTube.setTubeColor(tubeId, normColor).then(() => {
      const tubes = this.state.tubes.map((tube) => {
        if (tube.id === tubeId) {
          tube.color = normColor;
        }
        return tube;
      });
      this.setState({ tubes });
    });
  }

  subscribeToServer() {
    this.subscription = this.props.dataManager.ITKTube.onTubeGeneratorChange((tubeItem_) => {
      // TODO figure out why remote sends as array
      let tubeItem = tubeItem_;
      if (tubeItem instanceof Array) {
        tubeItem = tubeItem[0];
      }

      for (let i = 0; i < this.state.tubes.length; ++i) {
        if (tubeItem.id === this.state.tubes[i].id) {
          let tubes = [];
          if (tubeItem.mesh) {
            tubes = this.state.tubes.map((tube) => {
              if (tube.id === tubeItem.id) {
                Object.assign(tube, tubeItem);
              }
              return tube;
            });
          } else {
            // delete the non-productive tube
            tubes = this.state.tubes.filter(tube => tube.id !== tubeItem.id);
          }

          this.setState({ tubes });
          break;
        }
      }
    });
  }

  loadData() {
    const finishLoading = Message.loading('Loading image...', 0);

    // We are ready to talk to the server...
    this.props.dataManager.ITKTube.getVolumeData().then((dataDescription) => {
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
        finishLoading();
      });
    });

    this.props.dataManager.ITKTube.getTubes().then((tubes) => {
      this.setState({ tubes: this.prepareNewTubes(tubes) });
    });
  }

  segmentTube(i, j, k) {
    this.props.dataManager.ITKTube.generateTube(i, j, k, this.tubeController.scale).then((tube) => {
      // returns tube metadata, but not segmented result
      this.setState({ tubes: [...this.state.tubes, ...this.prepareNewTubes([tube])] });
    });
  }

  openFile(filename) {
    this.props.dataManager.ITKTube.open(filename).then((resp) => {
      if (resp.status === 'ok') {
        this.loadData();
        this.setState({ fsExplorerOpen: false });
      } else {
        Modal.error({ content: resp.reason });
      }
    });
  }

  reparentTubes(parent, children) {
    return new Promise((resolve, reject) => {
      if (children.indexOf(parent) > -1) {
        reject('Cannot reparent tube to itself!');
      }

      const cache = {};
      this.state.tubes.forEach((tube) => {
        if (tube.id === parent || children.indexOf(tube.id) !== -1) {
          cache[tube.id] = tube;
        }
      });

      const tubes = this.state.tubes.map((tube) => {
        if (cache[tube.id] && tube.id !== parent) {
          return Object.assign(tube, { parent });
        }
        return tube;
      });

      this.setState({ tubes });
      resolve();
    });
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
            tubes={this.state.tubes.filter(tube => tube.mesh)}
          />
        </div>
        <Tabs type="card">
          <TabPane forceRender key="file" tab="File">
            <div className={[style.horizontalContainer, style.controller].join(' ')}>
              <div className={[style.itemStretch, style.border].join(' ')}>
                <Button onClick={() => this.setState({ fsExplorerOpen: true })}>Open File...</Button>
                {this.state.imageData ?
                  <div style={{ marginTop: '10px' }}>
                    <h2>Image Info</h2>
                    <ul>
                      <li>Bounds: {this.state.imageData.getBounds().join(', ')}</li>
                      <li>Origin: {this.state.imageData.getOrigin().join(', ')}</li>
                      <li>Spacing: {this.state.imageData.getSpacing().join(', ')}</li>
                    </ul>
                  </div>
                  :
                  null
                }
              </div>
            </div>
          </TabPane>
          <TabPane forceRender key="tubes" tab="Tubes">
            <TubeController
              ref={(r) => { this.tubeController = r; }}
              tubes={this.state.tubes}
              onSetTubeVisibility={(id, visible) => this.setTubeVisibility(id, visible)}
              onDeleteTube={id => this.deleteTube(id)}
              onTubeColorChange={(id, color) => this.changeTubeColor(id, color)}
              onReparentTubes={(parent, children) => this.reparentTubes(parent, children)}
            />
          </TabPane>
          <TabPane forceRender key="volume" tab="Volume">
            <PiecewiseGaussianWidget ref={(r) => { this.volumeTransferWidget = r; }} />
          </TabPane>
        </Tabs>
        <RemoteFsExplorer
          dataManager={this.props.dataManager}
          visible={this.state.fsExplorerOpen}
          onFileSelect={filename => this.openFile(filename)}
          onCancel={() => this.setState({ fsExplorerOpen: false })}
        />
      </div>
    );
  }
}

App.propTypes = {
  dataManager: PropTypes.object.isRequired,
};

function main(dataManager) {
  render(
    <LocaleProvider locale={enUS}>
      <App dataManager={dataManager} />
    </LocaleProvider>,
    document.querySelector('.content'),
  );
}

// mode.local.run(main);
mode.remote.run(main);
