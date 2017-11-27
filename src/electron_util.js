import { ipcRenderer } from 'electron';

export default function init({ imageStore, tubeStore }) {
  // listen for signals from main process
  ipcRenderer.on('openFile', (event, filename) => {
    imageStore.openImage(filename);
  });
  ipcRenderer.on('saveTubes', (event, filename) => {
    tubeStore.saveTubes(filename);
  });
}
