import network from '../network';

function run(host, port, startFn, stopFn, errorFn) {
  network.onError(errorFn);
  network.connect({
    application: 'ITKTube',
    // dummy url
    sessionManagerURL: 'file://dummyurl',
    sessionURL: `ws://${host}:${port}/ws`,
  });

  startFn(network.getClient());
}

export default {
  run,
};
