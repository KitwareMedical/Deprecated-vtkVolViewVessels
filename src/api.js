import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

export default class Api {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.listeners = {};

    // subscribe to server events
    this.subscription = this.dataManager.ITKTube.onTubeGeneratorChange((item) => {
      // TODO figure out why remote sends as array
      let tubeItem = item;
      if (tubeItem instanceof Array) {
        tubeItem = tubeItem[0];
      }

      this.emit('segment', tubeItem);
    });
  }

  addEventListener(name, func) {
    this.listeners[name] = this.listeners[name] || [];
    this.listeners[name].push(func);
    // disconnect method
    return () => {
      this.listeners.splice(this.listeners.indexOf(func), 1);
    };
  }

  emit(name, ...args) {
    (this.listeners[name] || []).forEach(func => func(...args));
  }

  loadImage(filename) {
    return new Promise((resolve, reject) => {
      this.dataManager.ITKTube.openFile(filename)
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
        .catch(error => reject(error));
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
