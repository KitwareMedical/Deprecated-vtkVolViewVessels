import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import SliceViewer from './ui/SliceViewer';
import TubeController from './ui/TubeController';
import VolumeViewer from './ui/VolumeViewer';

import style from './Tube.mcss';

import mode from './mode';

// ----------------------------------------------------------------------------
// DOM handling
// ----------------------------------------------------------------------------

const container = document.querySelector('.content');
container.classList.add(style.rootContainer, style.verticalContainer);
container.innerHTML = `
  <div class="${style.horizontalContainer}  ${style.itemStretch}">
    <div class="js-left-pane ${style.itemStretch}"></div>
    <div class="js-right-pane ${style.itemStretch}"></div>
  </div>
  <div class="js-controller ${style.horizontalContainer} ${style.controller}"></div>`;

const leftPaneContainer = container.querySelector('.js-left-pane');
const rightPaneContainer = container.querySelector('.js-right-pane');
const controllerContainer = container.querySelector('.js-controller');

// ----------------------------------------------------------------------------

const sliceViewer = new SliceViewer(leftPaneContainer);
const tubeController = new TubeController(controllerContainer);
const volumeViewer = new VolumeViewer(rightPaneContainer);

const sharedContext = {};

function toPipeline(metadata) {
  const source = vtkPolyData.newInstance();
  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();

  const size = metadata.length;
  const coords = new Float32Array(size * 3);
  const radiusArray = new Float32Array(size);
  const cell = new Uint16Array(size + 1);

  cell[0] = size;
  metadata.forEach(({ x, y, z, radius }, index) => {
    coords[(index * 3) + 0] = x;
    coords[(index * 3) + 1] = y;
    coords[(index * 3) + 2] = z;
    radiusArray[index] = radius;
    cell[index + 1] = index;
  });
  source.getPoints().setData(coords, 3);
  source.getLines().setData(cell);
  source.getPointData().setScalars(vtkDataArray.newInstance({ name: 'radius', values: radiusArray }));

  actor.setMapper(mapper);
  mapper.setInputData(source);

  return { actor, mapper, source };
}

// ----------------------------------------------------------------------------

export function startApplication(dataManager) {
  sharedContext.dataManager = dataManager;
  // We are ready to talk to the server...
  dataManager.ITKTube.getVolumeData().then((dataDescription) => {
    const values = new window[dataDescription.typedArray](dataDescription.scalars);
    const dataArray = vtkDataArray.newInstance({ name: 'Scalars', values });
    delete dataDescription.scalars;
    delete dataDescription.typedArray;
    const imageData = vtkImageData.newInstance(dataDescription);
    imageData.getPointData().setScalars(dataArray);

    sliceViewer.updateData(imageData);
    volumeViewer.updateData(imageData);

    // Link tube request
    sliceViewer.onTubeRequest((i, j, k) => {
      const tubeScale = tubeController.getScale();
      dataManager.ITKTube.generateTube(i, j, k, tubeScale);
    });
  });

  sharedContext.subscription = dataManager.ITKTube.onTubeGeneratorChange((tubeItem) => {
    tubeController.udpateTubeItem(tubeItem);

    if (tubeItem.mesh) {
      volumeViewer.addGeometry(tubeItem.id, toPipeline(tubeItem.mesh));
    }
  });
}

// ----------------------------------------------------------------------------

export function stopApplication() {
  if (sharedContext.subscription) {
    sharedContext.dataManager.ITKTube.unsubscribe();
  }
  //
  sharedContext.dataManager.exit(10);
}

// ----------------------------------------------------------------------------
// Expect a server for now or not?
// ----------------------------------------------------------------------------

mode.local.run(startApplication, stopApplication);
// mode.remote.run(startApplication, stopApplication);

const resizeHandler = macro.debounce(() => {
  [sliceViewer, tubeController, volumeViewer].forEach(e => e.resize());
}, 50);

// Register window resize handler so workbench redraws when browser is resized
window.onresize = resizeHandler;
