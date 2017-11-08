import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import Store from './stores';

export default class ApiStore extends Store {
  constructor(dataManager) {
    super();
    this.dataManager = dataManager;
    this.privateData = {};
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
}
