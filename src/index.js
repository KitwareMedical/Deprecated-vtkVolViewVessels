import React from 'react';
import { render } from 'react-dom';
import { reaction } from 'mobx';

import { LocaleProvider, notification } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';

import App from './ui/App';

import ImageStore from './stores/ImageStore';
import TubeStore from './stores/TubeStore';

import mode from './mode';
import { init as initElectron, getHostPort } from './electron_util';

function main(dataManager) {
  // store setup
  const stores = Object.freeze({
    imageStore: new ImageStore(dataManager.ITKTube),
    tubeStore: new TubeStore(dataManager.ITKTube),
  });

  // electron setup
  initElectron(stores);

  // whenever an image is loaded, clear tubes.
  reaction(
    () => stores.imageStore.image,
    () => stores.tubeStore.reset(),
  );

  render(
    <LocaleProvider locale={enUS}>
      <App stores={stores} />
    </LocaleProvider>,
    document.querySelector('.content'),
  );
}

function onError() {
  notification.error({
    duration: 0,
    message: 'Server failed to start',
    description: (
      <p>Check the console output for issues, and verify your <code>electron/config</code> is correct.</p>
    ),
  });
}

// mode.local.run(main);
const [host, port] = getHostPort();
mode.remote.run(host, port, main, () => {}, onError);
