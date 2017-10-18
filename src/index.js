import SliceViewer from './ui/SliceViewer';
import VolumeViewer from './ui/VolumeViewer';
import TubeController from './ui/TubeController';
import network from './network';
import style from './Tube.mcss';

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
const volumeViewer = new VolumeViewer(rightPaneContainer);
const tubeController = new TubeController(controllerContainer);

let subscription = null;
let dataManager = null;

// ----------------------------------------------------------------------------

export function startApplication() {
  // We are ready to talk to the server...
  const imageData = dataManager.ITKTube.getVolumeData();
  console.log(imageData);

  sliceViewer.updateData(imageData);
  volumeViewer.updateData(imageData);
  tubeController.updateData(imageData);

  subscription = dataManager.ITKTube.onTubeGeneratorChange((tubeItem) => {
    console.log('Tube item update', tubeItem);
  });
}

// ----------------------------------------------------------------------------

export function stopApplication() {
  if (subscription) {
    dataManager.ITKTube.unsubscribe();
  }
  //
  dataManager.exit(10);
}

// ----------------------------------------------------------------------------

export function connectToServer() {
  network.onReady(() => {
    dataManager = network.getClient();
    startApplication();
  });
  network.connect({ application: 'ITKTube' });
}

// ----------------------------------------------------------------------------

export function localMode() {
  // FIXME todo...
}

// ----------------------------------------------------------------------------
// Expect a server for now
// ----------------------------------------------------------------------------

// connectToServer();
