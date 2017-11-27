import { createClient } from 'paraviewweb/src/IO/WebSocket/ParaViewWebClient';
import SmartConnect from 'wslink/src/SmartConnect';

let connection = null;
let client = null;
let smartConnect = null;
let readyCallback = null;

const customProtocols = {
  ITKTube: session => ({
    openFile: filename => session.call('itk.volume.open', [filename]),
    getTubes: () => session.call('itk.tube.get', []),
    generateTube: (coords, params) => session.call('itk.tube.generate', [coords, params]),
    onTubeGeneratorChange: callback => session.subscribe('itk.tube.mesh', callback),
    deleteTube: tubeId => session.call('itk.tube.delete', [tubeId]),
    setTubeColor: (tubeId, color) => session.call('itk.tube.setcolor', [tubeId, color]),
    reparentTubes: (parent, children) => session.call('itk.tube.reparent', [parent, children]),
    unsubscribe: subscription => session.unsubscribe(subscription),
  }),
};

function start(conn) {
  connection = conn;
  client = createClient(conn, [], customProtocols);

  if (readyCallback) {
    readyCallback();
  }
}

function exit(timeout = 60) {
  if (connection) {
    connection.destroy(timeout);
    connection = null;
  }
}

function connect(config = {}) {
  smartConnect = SmartConnect.newInstance({ config });
  smartConnect.onConnectionReady(start);
  smartConnect.connect();
}

function getClient() {
  return client;
}

function getConnection() {
  return connection;
}

function onReady(callback) {
  if (client && client.session.isOpen) {
    callback();
  } else {
    readyCallback = callback;
  }
}

export default {
  exit,
  connect,
  getClient,
  getConnection,
  onReady,
};
