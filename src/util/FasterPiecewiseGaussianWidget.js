import macro from 'vtk.js/Sources/macro';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';

/**
 * vtkFasterPiecewiseGaussianWidget
 *
 * This extends PiecewiseGaussianWidget with a fix for speeding up histogram
 * creation and adds a setter for the dataRange instance variable. For this
 * class, it is required to call `setDataRange` before `setDataArray`.
 */

/* eslint-disable no-continue */

// ----------------------------------------------------------------------------
// vtkFasterPiecewiseGaussianWidget methods
// ----------------------------------------------------------------------------

function vtkFasterPiecewiseGaussianWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFasterPiecewiseGaussianWidget');

  publicAPI.setDataArray = (array, numberOfBinToConsider = 1, numberOfBinsToSkip = 1) => {
    model.histogramArray = array;
    const size = array.length;
    const [min, max] = model.dataRange;
    const delta = (max - min);

    model.histogram = [];
    while (model.histogram.length < model.numberOfBins) {
      model.histogram.push(0);
    }
    for (let i = 0; i < size; i++) {
      const idx = Math.floor((model.numberOfBins - 1) * (Number(array[i]) - min) / delta);
      model.histogram[idx] += 1;
    }

    // Smart Rescale Histogram
    const sampleSize = Math.min(numberOfBinToConsider, model.histogram.length - numberOfBinsToSkip);
    const sortedArray = [].concat(model.histogram);
    sortedArray.sort((a, b) => (Number(a) - Number(b)));
    for (let i = 0; i < numberOfBinsToSkip; i++) {
      sortedArray.pop();
    }
    while (sortedArray.length > sampleSize) {
      sortedArray.shift();
    }
    const mean = sortedArray.reduce((a, b) => a + b, 0) / sampleSize;

    model.histogram = model.histogram.map(v => v / mean);
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // Be explicit about it being null here. That way not setting the dataRange
  // will result in an error instead of silently resulting in unintended results.
  dataRange: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // inheritance
  vtkPiecewiseGaussianWidget.extend(publicAPI, model, initialValues);

  // object methods
  macro.setGet(publicAPI, model, ['dataRange']);

  // Object specific methods
  vtkFasterPiecewiseGaussianWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPiecewiseGaussianWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
