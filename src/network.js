import { createClient } from 'paraviewweb/src/IO/WebSocket/ParaViewWebClient';
import SmartConnect from 'wslink/src/SmartConnect';

// Only try to connect 20 times
const MAX_CONN_ATTEMPTS = 20;
const RETRY_TIMEOUT = 500; // milliseconds

let connection = null;
let client = null;
let smartConnect = null;
let readyCallback = null;

const customProtocols = {
  ITKTube: session => ({
    openFile: filename => session.call('itk.volume.open', [filename]),
    saveTubes: filename => session.call('itk.tube.save', [filename]),
    generateTube: (coords, params) => session.call('itk.tube.generate', [coords, params]),
    onTubeGeneratorChange: callback => session.subscribe('itk.tube.mesh', callback),
    deleteTube: tubeId => session.call('itk.tube.delete', [tubeId]),
    setTubeColor: (tubeId, color) => session.call('itk.tube.setcolor', [tubeId, color]),
    reparentTubes: (parent, children) => session.call('itk.tube.reparent', [parent, children]),
    unsubscribe: subscription => session.unsubscribe(subscription),
  }),
};

// This promise is resolved from outside the promise body, since
// we need to notify whenever the connection is established.
let notifyConnect = null;
const waitForConnect = new Promise((resolve, reject) => {
  notifyConnect = resolve;
});

// We create a dummy ITKTube protocol here so we can determine
// which methods are actually defined when checking in the proxy.
const proxyClient = {
  ITKTube:
    new Proxy(customProtocols.ITKTube(), {
      get: (target, name) => {
        if (!target[name]) {
          return undefined;
        }
        return (...args) =>
          waitForConnect.then(
              () => client.ITKTube[name](...args));
      },
    }),
};

function start(conn) {
  connection = conn;
  client = createClient(conn, [], customProtocols);

  notifyConnect();
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

  let retryCount = 0;
  const scheduleConnect = () => {
    ++retryCount;
    if (retryCount <= MAX_CONN_ATTEMPTS) {
      // Don't need exponential back-off for local connection
      setTimeout(() => smartConnect.connect(), RETRY_TIMEOUT);
    }
  };
  smartConnect.onConnectionError(scheduleConnect);
  scheduleConnect();
}

function getClient() {
  return proxyClient;
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
