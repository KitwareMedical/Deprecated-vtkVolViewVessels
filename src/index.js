import React from 'react';
import { render } from 'react-dom';

import { LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import App from './ui/App';
import Api from './api';

import imageData, { imageLoader } from './stores/ImageStore';
import { data as tubeData, tubeSideEffects } from './stores/TubeStore';
import volumeData from './stores/VolumeStore';
import segmentData from './stores/SegmentStore';

import Store from './stores/stores';
// import ApiStore from './stores/ApiStore';
// import ImageStore from './stores/ImageStore';
// import SegmentStore from './stores/SegmentStore';
// import TubeStore from './stores/TubeStore';
// import VolumeRenderStore from './stores/VolumeRenderStore';

import mode from './mode';

function main(dataManager) {
  const api = new Api(dataManager);
  const stores = {
    imageStore: new Store(imageData(), imageLoader(api)),
    tubeStore: new Store(tubeData(), tubeSideEffects(api)),
    volumeStore: new Store(volumeData()),
    segmentStore: new Store(segmentData()),
    // volumeRender: new VolumeRenderStore(),
    // segment: new SegmentStore(),
    // tubes: new TubeStore(),
  };

  render(
    <LocaleProvider locale={enUS}>
      <App stores={stores} />
    </LocaleProvider>,
    document.querySelector('.content'),
  );
}

// mode.local.run(main);
mode.remote.run(main);
