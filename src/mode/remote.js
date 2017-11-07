import network from '../network';

function run(startFn, stopFn) {
  network.onReady(() => {
    startFn(network.getClient());
  });
  network.connect({
    application: 'ITKTube',
    // dummy url
    sessionManagerURL: 'file://dummyurl',
    // TODO don't hardcode this
    sessionURL: 'ws://localhost:8080/ws',
  });
}

export default {
  run,
};
