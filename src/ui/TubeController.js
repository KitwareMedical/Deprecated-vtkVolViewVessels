import style from '../Tube.mcss';

const htmlTemplate = `
  <div class="${style.verticalContainer} ${style.itemStretch} ${style.border}">
    <div class="${style.horizontalContainer}">
      <label class="${style.label}">Scale</label>
      <input class="js-scale ${style.slider}" type="range" min="0" value="5" max="10" />
    </div>
    <div class="js-tubes ${style.itemStretch} ${style.overflowScroll}">
    </div>
  </div>
  <div class="js-volume-controller ${style.verticalContainer} ${style.itemStretch} ${style.border}" style="background: red;">
  </div>
`;

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
        `<table class="${style.table}"><tr><th>Position</th><th>Scale</th><th>Status</th></tr>`,
        Object.keys(this.tubes).map(i => this.tubes[i]).map(i => `<tr><td>${i.position}</td><td>${i.scale}</td><td>${i.status}</td></tr>`),
        '</table>',
        ).join('');
  }

  udpateTubeItem(item) {
    // console.log(item);
    this.tubes[item.id] = item;
    this.render();
  }

  getScale() {
    return Number(this.scaleElement.value) / 10;
  }
}
