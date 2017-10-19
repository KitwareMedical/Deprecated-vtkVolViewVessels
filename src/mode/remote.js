import network from '../network';

function run(startFn, stopFn) {
  network.onReady(() => {
    startFn(network.getClient());
  });
  network.connect({ application: 'ITKTube' });
}

export default {
  run,
};
