import network from '../network';

function run(host, port, startFn, stopFn) {
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
