import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

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
    tubeController.updateData(imageData);
  });

  sharedContext.subscription = dataManager.ITKTube.onTubeGeneratorChange((tubeItem) => {
    console.log('Tube item update', tubeItem);
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
