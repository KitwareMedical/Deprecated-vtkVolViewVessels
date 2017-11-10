import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import Store from './stores';

export default class ApiStore extends Store {
  constructor(dataManager) {
    super();
    this.dataManager = dataManager;
    this.privateData = {
      // NOTE can one result get overwritten by another before callbacks
      // are handled?
      tubeResult: null,
    };

    // subscribe to server events
    this.subscription = this.dataManager.ITKTube.onTubeGeneratorChange((item) => {
      // TODO figure out why remote sends as array
      let tubeItem = item;
      if (tubeItem instanceof Array) {
        tubeItem = tubeItem[0];
      }

      this.privateData.tubeResult = tubeItem;
      this.update();
    });
  }

  get data() {
    return this.privateData;
  }

  loadImage(filename) {
    return new Promise((resolve, reject) => {
      this.dataManager.ITKTube.getVolumeData()
        .then((dataDescription) => {
          const reader = new FileReader();
          reader.readAsArrayBuffer(dataDescription.scalars);

          reader.addEventListener('loadend', () => {
            const values = new window[dataDescription.typedArray](reader.result);
            const dataArray = vtkDataArray.newInstance({ name: 'Scalars', values });
            delete dataDescription.scalars;
            delete dataDescription.typedArray;
            const imageData = vtkImageData.newInstance(dataDescription);
            imageData.getPointData().setScalars(dataArray);

            resolve(imageData);
          });
        })
        .catch(e => reject(e));
    });
  }

  loadTubes() {
    return this.dataManager.ITKTube.getTubes();
  }

  segmentTube(coords, scale) {
    return this.dataManager.ITKTube.generateTube(...coords, scale);
  }

  setTubeColor(id, color) {
    return this.dataManager.ITKTube.setTubeColor(id, color);
  }

  reparentTubes(parent, children) {
    return this.dataManager.ITKTube.reparentTubes(parent, children);
  }

  deleteTube(id) {
    return this.dataManager.ITKTube.deleteTube(id);
  }
}
