import React from 'react';
import PropTypes from 'prop-types';

import { Tabs } from 'antd';

// import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
// import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import { connectAction } from '../state';
import style from '../Tube.mcss';

import ControllableSliceView from './ControllableSliceView';
import ControllableVolumeView from './ControllableVolumeView';
import Info from './Info';
import SegmentControls from './SegmentControls';
import TubeTreeView from './TubeTreeView';
import PiecewiseGaussianWidget from './PiecewiseGaussianWidget';
// import Messages from './Messages';
// import { loadImage } from '../actions/ImageActions';
import { loadImage } from '../stores/ImageStore';
import { addTube, loadTubes, listenForTubes } from '../stores/TubeStore';
// import { updateTube } from '../stores/TubeStore';
// import { loadTubes, updateTube } from '../actions/TubeActions';
// import RemoteFsExplorer from './RemoteFsExplorer';

const TabPane = Tabs.TabPane;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.disconnects = [];
  }
//  constructor(props) {
//    super(props);
//    this.state = {
//      imageData: null,
//      tubes: [],
//
//      // ui
//      fsExplorerOpen: false,
//    };
//
//    this.subscription = null;
//  }

  componentDidMount() {
//    this.controllableVolumeView.volumeView.setTransferFunctionWidget(this.volumeTransferWidget.vtkWidget);
//    this.subscribeToServer();
//    this.loadData();
//    const { dispatch } = this.props;
    // dispatch(loadImage);
    // dispatch(loadTubes);
    const { stores: { imageStore, segmentStore, tubeStore } } = this.props;

    connectAction(segmentStore, 'segmentedTube', tubeStore, addTube);

    imageStore.dispatch(loadImage());
    tubeStore.dispatch(loadTubes());
    tubeStore.dispatch(listenForTubes());
  }

  componentWillReceiveProps(props) {
    /*
    const { actions, dispatch, tubeResult } = props;
    const { tubeResult: prevTubeResult } = this.props;

    if (prevTubeResult !== tubeResult) {
      dispatch(actions.updateTube, tubeResult);
    } */
  }

  componentWillUnmount() {
//    if (this.subscription) {
//      this.props.dataManager.ITKTube.unsubscribe();
//    }
//    //
//    this.props.dataManager.exit(10);
  }

//  setTubeVisibility(id, visible) {
//    const tubes = this.state.tubes.map((tube) => {
//      if (tube.id === id) {
//        tube.visible = visible;
//      }
//      return tube;
//    });
//    this.setState(({ tubes }));
//  }
//
//  prepareNewTubes(tubes) {
//    return tubes.map(tube => Object.assign({ visible: true, key: tube.id }, tube));
//  }
//
//  deleteTube(tubeId) {
//    this.props.dataManager.ITKTube.deleteTube(tubeId).then(() => {
//      let newParent = -1;
//      const tubes = [];
//      this.state.tubes.forEach((tube) => {
//        if (tube.id === tubeId) {
//          newParent = tube.parent;
//        } else {
//          tubes.push(tube);
//        }
//      });
//
//      // reparent any children to the deleted tube's parent
//      tubes.forEach((tube) => {
//        if (tube.parent === tubeId) {
//          tube.parent = newParent;
//        }
//      });
//
//      this.setState(({ tubes }));
//    });
//  }
//
//  changeTubeColor(tubeId, color) {
//    const normColor = [color.r / 255, color.g / 255, color.b / 255];
//    this.props.dataManager.ITKTube.setTubeColor(tubeId, normColor).then(() => {
//      const tubes = this.state.tubes.map((tube) => {
//        if (tube.id === tubeId) {
//          tube.color = normColor;
//        }
//        return tube;
//      });
//      this.setState({ tubes });
//    });
//  }
//
//  subscribeToServer() {
//    this.subscription = this.props.dataManager.ITKTube.onTubeGeneratorChange((tubeItem_) => {
//      // TODO figure out why remote sends as array
//      let tubeItem = tubeItem_;
//      if (tubeItem instanceof Array) {
//        tubeItem = tubeItem[0];
//      }
//
//      for (let i = 0; i < this.state.tubes.length; ++i) {
//        if (tubeItem.id === this.state.tubes[i].id) {
//          let tubes = [];
//          if (tubeItem.mesh) {
//            tubes = this.state.tubes.map((tube) => {
//              if (tube.id === tubeItem.id) {
//                Object.assign(tube, tubeItem);
//              }
//              return tube;
//            });
//          } else {
//            // delete the non-productive tube
//            tubes = this.state.tubes.filter(tube => tube.id !== tubeItem.id);
//          }
//
//          this.setState({ tubes });
//          break;
//        }
//      }
//    });
//  }
//
//  loadData() {
//    this.props.dataManager.ITKTube.getTubes().then((tubes) => {
//      this.setState({ tubes: this.prepareNewTubes(tubes) });
//    });
//  }
//
//  segmentTube(i, j, k) {
//    this.props.dataManager.ITKTube.generateTube(i, j, k, this.tubeController.scale).then((tube) => {
//      // returns tube metadata, but not segmented result
//      this.setState({ tubes: [...this.state.tubes, ...this.prepareNewTubes([tube])] });
//    });
//  }
//
//  openFile(filename) {
//    this.props.dataManager.ITKTube.open(filename).then((resp) => {
//      if (resp.status === 'ok') {
//        this.loadData();
//        this.setState({ fsExplorerOpen: false });
//      } else {
//        Modal.error({ content: resp.reason });
//      }
//    });
//  }
//
//  reparentTubes(parent, children) {
//    return this.props.dataManager.ITKTube.reparentTubes(parent, children).then((resp) => {
//      if (resp.status === 'error') {
//        throw new Error('Cannot reparent tube to itself!');
//      }
//
//      const cache = {};
//      this.state.tubes.forEach((tube) => {
//        if (tube.id === parent || children.indexOf(tube.id) !== -1) {
//          cache[tube.id] = tube;
//        }
//      });
//
//      const tubes = this.state.tubes.map((tube) => {
//        if (tube.id in cache && tube.id !== parent) {
//          return Object.assign(tube, { parent });
//        }
//        return tube;
//      });
//
//      this.setState({ tubes });
//    });
//  }
//
//  render() {
//    return (
//      <div className={style.reactRoot}>
//        <div className={[style.vtkViewer, style.horizontalContainer, style.itemStretch].join(' ')}>
//          <ControllableSliceView
//            imageData={this.state.imageData}
//            onPickIJK={(i, j, k) => this.segmentTube(i, j, k)}
//          />
//          <ControllableVolumeView
//            ref={(r) => { this.controllableVolumeView = r; }}
//            imageData={this.state.imageData}
//            tubes={this.state.tubes.filter(tube => tube.mesh)}
//          />
//        </div>
//        <Tabs type="card">
//          <TabPane forceRender key="file" tab="File">
//            <div className={[style.horizontalContainer, style.controller].join(' ')}>
//              <div className={[style.itemStretch, style.border].join(' ')}>
//                <Button onClick={() => this.setState({ fsExplorerOpen: true })}>Open File...</Button>
//                {this.state.imageData ?
//                  <div style={{ marginTop: '10px' }}>
//                    <h2>Image Info</h2>
//                    <ul>
//                      <li>Bounds: {this.state.imageData.getBounds().join(', ')}</li>
//                      <li>Origin: {this.state.imageData.getOrigin().join(', ')}</li>
//                      <li>Spacing: {this.state.imageData.getSpacing().join(', ')}</li>
//                    </ul>
//                  </div>
//                  :
//                  null
//                }
//              </div>
//            </div>
//          </TabPane>
//          <TabPane forceRender key="tubes" tab="Tubes">
//            <TubeController
//              ref={(r) => { this.tubeController = r; }}
//              tubes={this.state.tubes}
//              onSetTubeVisibility={(id, visible) => this.setTubeVisibility(id, visible)}
//              onDeleteTube={id => this.deleteTube(id)}
//              onTubeColorChange={(id, color) => this.changeTubeColor(id, color)}
//              onReparentTubes={(parent, children) => this.reparentTubes(parent, children)}
//            />
//          </TabPane>
//          <TabPane forceRender key="volume" tab="Volume">
//            <PiecewiseGaussianWidget ref={(r) => { this.volumeTransferWidget = r; }} />
//          </TabPane>
//        </Tabs>
//        <RemoteFsExplorer
//          dataManager={this.props.dataManager}
//          visible={this.state.fsExplorerOpen}
//          onFileSelect={filename => this.openFile(filename)}
//          onCancel={() => this.setState({ fsExplorerOpen: false })}
//        />
//      </div>
//    );
//  }

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
        <Messages stores={stores} /> */ }
      </div>
    );
  }
}

App.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default App;
