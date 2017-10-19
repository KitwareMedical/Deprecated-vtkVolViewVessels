// import vtkRTAnalyticSource from 'vtk.js/Sources/Filters/Sources/RTAnalyticSource';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';

import vti from '../../data/sample/volume.vti';

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

          resolve(response);
        });
      },
      generateTube(...args) {
        console.log(...args);
      },
      onTubeGeneratorChange() {
        return 0;
      },
      unsubscribe() {
      },
    },
  };
}

function run(startFn, stopFn) {
  startFn(buildDataProvider());
}

export default {
  run,
};
