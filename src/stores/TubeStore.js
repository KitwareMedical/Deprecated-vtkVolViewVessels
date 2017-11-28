import { action, observable } from 'mobx';

import MessageStore from './MessageStore';

const DEFAULT_SCALE = 2.0;

export default class TubeStore extends MessageStore {
  @observable tubes = observable.map({});
  @observable segmentParams = {
    scale: DEFAULT_SCALE,
  };

  constructor(api) {
    super();
    this.api = api;

    this.api.onTubeGeneratorChange((result) => {
      const [tube] = result;
      if (!this.tubes.has(tube.id)) {
        console.warn('Received untracked tube result????');
      }
      this.updateTube(tube);
    });
  }

  openTubes(filename) {
    this.api.openTubes(filename)
      .then((tubeGroup) => {
        console.log('done');
      });
  }

  saveTubes(filename) {
    this.startLoading('Saving tubes...');

    this.api.saveTubes(filename)
      .then(() => {
        this.setSuccess('Tubes saved');
      })
      .catch(error => this.setError(`Error in ${error.data.method}`, error.data.exception));
  }

  segmentTube(coords) {
    return this.api.generateTube(coords, this.segmentParams)
      .then((tube) => {
        this.addTube(tube);
      })
      .catch(error => this.setError(`Error in ${error.data.method}`, error.data.exception));
  }

  @action('reset')
  reset() {
    this.tubes.clear();
    this.segmentParams.scale = DEFAULT_SCALE;
  }

  @action('updateSegmentParams')
  updateSegmentParams(newParams) {
    Object.assign(this.segmentParams, newParams);
  }

  @action('addTube')
  addTube(tube) {
    this.tubes.set(tube.id, Object.assign(tube, {
      visible: true,
    }));
  }

  @action('updateTube')
  updateTube(tube) {
    if (tube.mesh) {
      // we create a new tube object when updating
      this.tubes.set(tube.id, Object.assign({}, this.tubes.get(tube.id), tube));
    } else {
      this.tubes.delete(tube.id);
    }
  }

  @action('setTubeVisibility')
  setTubeVisibility(id, visible) {
    this.tubes.set(id, Object.assign({}, this.tubes.get(id), { visible }));
  }

  @action('setTubeColor')
  setTubeColor(id, color) {
    this.api.setTubeColor(id, color)
      .then(() => this.tubes.set(id, Object.assign({}, this.tubes.get(id), { color })))
      .catch(error => this.setError(`Error in ${error.data.method}`, error.data.exception));
  }

  @action('deleteTube')
  deleteTube(id) {
    // TODO delete all children of current tube
    this.api.deleteTube(id)
      .then(() => this.tubes.delete(id))
      .catch(error => this.setError(`Error in ${error.data.method}`, error.data.exception));
  }

  @action('reparent')
  reparent(parent, children) {
    this.api.reparentTubes(parent, children)
      .then(() => {
        for (let i = 0; i < children.length; ++i) {
          const child = children[i];
          this.tubes.set(child, Object.assign({}, this.tubes.get(child), { parent }));
        }
      })
      .catch(error => this.setError(`Error in ${error.data.method}`, error.data.exception));
  }
}
