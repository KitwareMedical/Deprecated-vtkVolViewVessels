import React from 'react';
import { render } from 'react-dom';

import { LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import App from './ui/App';
import Api from './api';

import imageData, { imageLoader } from './stores/ImageStore';
import tubeData, { tubeSideEffects } from './stores/TubeStore';
import volumeData from './stores/VolumeStore';
import segmentData, { segmenter } from './stores/SegmentStore';

import Store from './stores/stores';

import mode from './mode';
import initElectron from './electron_util';

function main(dataManager) {
  const api = new Api(dataManager.ITKTube);
  const stores = {
    imageStore: new Store(imageData(), imageLoader(api)),
    tubeStore: new Store(tubeData(), tubeSideEffects(api)),
    volumeStore: new Store(volumeData()),
    segmentStore: new Store(segmentData(), segmenter(api)),
  };

  // electron setup
  initElectron(api, stores);

  render(
    <LocaleProvider locale={enUS}>
      <App stores={stores} />
    </LocaleProvider>,
    document.querySelector('.content'),
  );
}

// mode.local.run(main);
mode.remote.run(main);
