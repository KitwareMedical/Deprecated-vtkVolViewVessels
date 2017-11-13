import React from 'react';
import { render } from 'react-dom';

import { LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import App from './ui/App';
import Api from './api';

import { data as imageData } from './stores/ImageStore';
import { data as apiData } from './stores/ApiStore';
import { data as tubeData } from './stores/TubeStore';
import volumeData from './stores/VolumeStore';

import { createStore } from './stores/stores';
// import ApiStore from './stores/ApiStore';
// import ImageStore from './stores/ImageStore';
// import SegmentStore from './stores/SegmentStore';
// import TubeStore from './stores/TubeStore';
// import VolumeRenderStore from './stores/VolumeRenderStore';

import mode from './mode';

function main(dataManager) {
  const api = new Api(dataManager);
  const stores = {
    apiStore: createStore(apiData(), api),
    imageStore: createStore(imageData()),
    tubeStore: createStore(tubeData()),
    volumeStore: createStore(volumeData()),
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
