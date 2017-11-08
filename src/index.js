import React from 'react';
import { render } from 'react-dom';

import { LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import App from './ui/App';
import ApiStore from './stores/ApiStore';
import ImageStore from './stores/ImageStore';
import VolumeRenderStore from './stores/VolumeRenderStore';

import mode from './mode';

// const App2 = connect(App, ['tubes'], (stores, props) => {});

//      <App dataManager={dataManager} />

function main(dataManager) {
  const stores = {
    api: new ApiStore(dataManager),
    image: new ImageStore(),
    volumeRender: new VolumeRenderStore(),
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
