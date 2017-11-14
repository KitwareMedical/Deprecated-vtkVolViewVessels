import { ipcRenderer } from 'electron';

import { loadImage } from './stores/ImageStore';

export default function init(api, { imageStore }) {
  // listen for signals from main process
  ipcRenderer.on('openFile', (event, filename) => {
    imageStore.dispatch(loadImage(filename));
  });
}
