import React from 'react';
import { render } from 'react-dom';

import { LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import App from './ui/App';

import ImageStore from './stores/ImageStore';

import mode from './mode';
import initElectron from './electron_util';

function main(dataManager) {
  // store setup
  const stores = Object.freeze({
    imageStore: new ImageStore(dataManager.ITKTube),
  });

  // electron setup
  initElectron(stores);

  render(
    <LocaleProvider locale={enUS}>
      <App stores={stores} />
    </LocaleProvider>,
    document.querySelector('.content'),
  );
}

// mode.local.run(main);
mode.remote.run(main);
