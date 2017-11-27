import { action, observable } from 'mobx';

export default class LoadAndErrorStore {
  @observable loading = '';
  @observable lastError = {
    title: '',
    description: '',
  };

  @action('setError')
  setError(title, description) {
    // stop any prior loading
    this.doneLoading();

    this.lastError.title = title;
    this.lastError.description = description;
  }

  @action('startLoading')
  startLoading(message = 'Loading...') {
    this.loading = message;
  }

  @action('doneLoading')
  doneLoading() {
    this.loading = '';
  }
}
