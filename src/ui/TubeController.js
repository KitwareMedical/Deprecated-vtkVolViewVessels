import React from 'react';

import style from '../Tube.mcss';

export default class TubeController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className={['js-controller', style.horizontalContainer, style.controller].join(' ')}>
        <div className={[style.verticalContainer, style.itemStretch, style.border].join(' ')}>
          <div className={style.horizontalContainer}>
            <label className={style.label}>Scale</label>
            <input className={['js-scale', style.slider].join(' ')} type="range" min="0" value="5" max="10" />
          </div>
          <div className={['js-tubes', style.itemStretch, style.overflowScroll].join(' ')} />
        </div>
        <div className={['js-volume-controller', style.verticalContainer, style.itemStretch, style.border].join(' ')} />
      </div>
    );
  }
}

/*
export default class TubeController {
  constructor(container) {
    this.root = container;
    container.classList.add(style.horizontalContainer);
    container.innerHTML = htmlTemplate;
    this.scaleElement = container.querySelector('.js-scale');
    this.tubesContainer = container.querySelector('.js-tubes');
    this.volumeControllerContainer = container.querySelector('.js-volume-controller');
    this.tubes = {};
  }

  resize() {
  }

  render() {
    // id: tubes.length, position: [i, j, k], scale, status:
    this.tubesContainer.innerHTML = [].concat(
        `<table class="${style.table}"><tr><th>Position</th><th># of points</th><th>Status</th></tr>`,
        Object.keys(this.tubes).map(i => this.tubes[i]).map(i => `<tr><td>${i.position}</td><td>${i.mesh.length}</td><td>${i.status}</td></tr>`),
        '</table>',
        ).join('');
  }

  updateTubeItem(item) {
    // console.log(item);
    this.tubes[item.id] = item;
    this.render();
  }

  getScale() {
    return Number(this.scaleElement.value) / 10;
  }

  getPiecewiseEditorContainer() {
    return this.volumeControllerContainer;
  }
}
*/
