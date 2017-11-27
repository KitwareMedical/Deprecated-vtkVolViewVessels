import { action, observable } from 'mobx';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';

import MessageStore from './MessageStore';

export default class ImageStore extends MessageStore {
  @observable image = null;

  constructor(api) {
    super();
    this.api = api;
  }

  openImage(filename) {
    this.startLoading('Loading image...');

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

          this.doneLoading();
          this.setImageData(imageData);
        });

        reader.readAsArrayBuffer(imageDesc.scalars);
      })
      .catch((error) => {
        this.setError(`Error in ${error.data.method}`, error.data.exception);
      });
  }

  @action('setImageData')
  setImageData(imageData) {
    this.image = imageData;
  }
}
