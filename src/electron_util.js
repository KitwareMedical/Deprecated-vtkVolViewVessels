import { ipcRenderer, remote } from 'electron';

export function getHostPort() {
  return [remote.process.env.SERVER_HOST, remote.process.env.SERVER_PORT];
}

export function init({ imageStore, tubeStore }) {
  // listen for signals from main process
  ipcRenderer.on('openFile', (event, filename) => {
    imageStore.openImage(filename);
  });
  ipcRenderer.on('saveTubes', (event, filename) => {
    tubeStore.saveTubes(filename);
  });
}
