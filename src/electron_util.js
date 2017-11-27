import { ipcRenderer } from 'electron';

export default function init({ imageStore }) {
  // listen for signals from main process
  ipcRenderer.on('openFile', (event, filename) => {
    imageStore.openImage(filename);
  });
}
