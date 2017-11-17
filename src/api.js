import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

export default class Api {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.listeners = {};

    // subscribe to server events
    this.subscription = this.dataManager.onTubeGeneratorChange((item) => {
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
    return this.dataManager.openFile(filename)
      .then((imageDesc) => {
        const scalars = new Uint8Array(imageDesc.scalars);
        const values = new window[imageDesc.typedArray](scalars.buffer);
        console.log(values);
        const dataArray = vtkDataArray.newInstance({ name: 'Scalars', values });
        delete imageDesc.scalars;
        delete imageDesc.typedArray;
        const imageData = vtkImageData.newInstance(imageDesc);
        imageData.getPointData().setScalars(dataArray);

        return imageData;
      });
  }

  loadTubes() {
    return this.dataManager.getTubes();
  }

  segmentTube(coords, scale) {
    return this.dataManager.generateTube(...coords, scale);
  }

  setTubeColor(id, color) {
    return this.dataManager.setTubeColor(id, color);
  }

  reparentTubes(parent, children) {
    return this.dataManager.reparentTubes(parent, children);
  }

  deleteTube(id) {
    return this.dataManager.deleteTube(id);
  }
}
