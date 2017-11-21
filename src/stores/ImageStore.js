import { action, observable } from 'mobx';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

// TODO extends LoadAndErrorStore
export default class ImageStore {
  @observable image;

  constructor(api) {
    this.api = api;
  }

  openImage(filename) {
    return this.api.openFile(filename)
      .then((imageDesc) => {
        const reader = new FileReader();
        reader.addEventListener('load', (ev) => {
          const values = new window[imageDesc.typedArray](ev.target.result);
          const dataArray = vtkDataArray.newInstance({ name: 'Scalars', values });

          delete imageDesc.scalars;
          delete imageDesc.typedArray;
          const imageData = vtkImageData.newInstance(imageDesc);
          imageData.getPointData().setScalars(dataArray);

          this.setImageData(imageData);
        });
      });
    // TODO catch
  }

  @action('setImageData')
  setImageData(imageData) {
    this.image = imageData;
  }
}
