// import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';

import vti from '../../data/Branch.n010.vti';

const tubes = [];
const tubeListeners = [];
let bounds;

function generateNewMesh(scale) {
  const nbStep = (Math.random() * 100) + 5;
  const x = (Math.random() * (bounds[1] - bounds[0])) + bounds[0];
  const y = (Math.random() * (bounds[3] - bounds[2])) + bounds[2];
  const z = (Math.random() * (bounds[5] - bounds[4])) + bounds[4];
  const radius = Math.random() * scale;

  const mesh = [{ x, y, z, radius }];
  for (let i = 0; i < nbStep; i++) {
    const newPoint = Object.assign({}, mesh[mesh.length - 1]);

    newPoint.x += ((Math.random() - 0.5) * (bounds[1] - bounds[0])) / 10;
    newPoint.y += ((Math.random() - 0.5) * (bounds[3] - bounds[2])) / 10;
    newPoint.z += ((Math.random() - 0.5) * (bounds[5] - bounds[4])) / 10;
    newPoint.radius += 0.01;

    mesh.push(newPoint);
  }
  return mesh;
}

function publish(tube) {
  tubeListeners.forEach(l => l(tube));
}

function processQueuedTubes() {
  const nextTube = tubes.find(t => t.status === 'queued');
  if (nextTube) {
    nextTube.status = 'computing';
    publish(nextTube);
  }
  setTimeout(processQueuedTubes, 100);
}

function processComputingTubes() {
  const nextTube = tubes.find(t => t.status === 'computing');
  if (nextTube) {
    nextTube.status = 'done';
    nextTube.mesh = generateNewMesh(nextTube.scale);
    publish(nextTube);
  }
  setTimeout(processComputingTubes, Math.random() * 10000);
}

function buildDataProvider() {
  return {
    ITKTube: {
      getVolumeData() {
        return new Promise((resolve, reject) => {
          // const source = vtkRTAnalyticSource.newInstance();
          // source.setWholeExtent(0, 200, 0, 200, 0, 200);
          // source.setCenter(100, 100, 100);
          // source.setStandardDeviation(0.3);
          // source.update();

          const source = vtkXMLImageDataReader.newInstance();
          source.parse(vti);

          const imageData = source.getOutputData();
          const typedScalars = imageData.getPointData().getScalars().getData();
          const scalars = typedScalars.buffer;
          const typedArray = vtkDataArray.getDataType(typedScalars);
          const response = Object.assign({}, imageData.get('origin', 'spacing', 'extent'), { scalars, typedArray });

          bounds = imageData.getBounds();

          resolve(response);
        });
      },
      generateTube(i, j, k, scale) {
        return new Promise((resolve, reject) => {
          const tube = { id: tubes.length, position: [i, j, k], scale, status: 'queued' };
          tubes.push(tube);
          return tube;
        });
      },
      onTubeGeneratorChange(callback) {
        tubeListeners.push(callback);
      },
      deleteTube(tubeId) {
        return new Promise((resolve, reject) => {
          for (let i = 0; i < tubes.length; ++i) {
            if (tubes[i].id === tubeId) {
              tubes.splice(i, 1);
              break;
            }
          }
        });
      },
      unsubscribe() {
      },
    },
  };
}

function run(startFn, stopFn) {
  startFn(buildDataProvider());
}

// Start fake processing queue
processQueuedTubes();
processComputingTubes();

export default {
  run,
};
