import { action, observable } from 'mobx';

// TODO extends LoadAndErrorStore
export default class TubeStore {
  @observable tubes = [];
  @observable segmentParams = {
    scale: 2.0,
  };

  constructor(api) {
    this.api = api;
  }

  @action('updateSegmentParams')
  updateSegmentParams(newParams) {
    Object.assign(this.segmentParams, newParams);
  }
}
