import network from '../network';

function run(startFn, stopFn) {
  network.connect({
    application: 'ITKTube',
    // dummy url
    sessionManagerURL: 'file://dummyurl',
    // TODO don't hardcode this
    sessionURL: 'ws://localhost:8080/ws',
  });

  startFn(network.getClient());
}

export default {
  run,
};
