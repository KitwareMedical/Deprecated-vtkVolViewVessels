import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer           from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow       from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkImageMapper        from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice         from 'vtk.js/Sources/Rendering/Core/ImageSlice';

import style from '../Tube.mcss';

const htmlTemplate = `
  <div class="js-renderer ${style.itemStretch}"></div>
  <div class="${style.horizontalContainer} ${style.controlLine}">
    <label class="${style.label}">Window</label>
    <input class="js-slider-window ${style.slider}" type="range" min="0" value="0" max="10" />
    <label class="${style.label}">Level</label>
    <input class="js-slider-level ${style.slider}" type="range" min="0" value="0" max="10" />
  </div>
  <div class="${style.horizontalContainer} ${style.controlLine}">
    <div class="js-slice-normal-button ${style.button}" data-current-slicing-mode="0">X</div>
    <div class="js-slice-normal-button ${style.button}" data-current-slicing-mode="1">Y</div>
    <div class="js-slice-normal-button ${style.button}" data-current-slicing-mode="2">Z</div>
    <input class="js-slider-slice ${style.slider}" type="range" min="0" value="0" max="10" />
  </div>
`;

function updateSlider(el, props) {
  Object.keys(props).forEach((attributeName) => {
    el.setAttribute(attributeName, props[attributeName]);
  });
}

export default class SliceViewer {
  constructor(container) {
    this.currentSlicingMode = 2;
    this.root = container;
    container.classList.add(style.verticalContainer);
    container.innerHTML = htmlTemplate;

    this.renderWindowContainer = container.querySelector('.js-renderer');
    this.windowSlider = container.querySelector('.js-slider-window');
    this.levelSlider = container.querySelector('.js-slider-window');
    this.sliceSlider = container.querySelector('.js-slider-window');

    // Create vtk.js rendering pieces
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);
    this.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.renderWindow.addView(this.openGlRenderWindow);
    this.actor = vtkImageSlice.newInstance();
    this.mapper = vtkImageMapper.newInstance();
    this.actor.setMapper(this.mapper);
    this.camera = this.renderer.getActiveCamera();
    this.camera.setParallelProjection(true);

    this.openGlRenderWindow.setContainer(this.renderWindowContainer);
    this.resize();

    // Add DOM listeners
    this.windowSlider.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      this.actor.getProperty().setColorWindow(value);
      this.render();
    });

    this.levelSlider.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      this.actor.getProperty().setColorLevel(value);
      this.render();
    });

    this.sliceSlider.addEventListener('input', (event) => {
      const value = Number(event.target.value);
      this.mapper[`set${'XYZ'[this.currentSlicingMode]}Slice`](value);
      this.render();
    });

    [].forEach.call(container.querySelectorAll('.js-slice-normal-button'), (button) => {
      button.addEventListener('click', (event) => {
        this.currentSlicingMode = Number(event.target.dataset.currentSlicingMode);
        this.updateSliceSlider();
      });
    });
  }

  updateSliceSlider() {
    if (this.dataset) {
      const max = this.dataset.getDimensions()[this.currentSlicingMode];
      const value = Math.ceil(max / 2);
      updateSlider(this.sliceSlider, { max, value });
      this.renderer.resetCamera();
      this.render();
    }
  }

  updateData(imageDataToLoad) {
    const needToAddActor = !this.dataset;
    this.dataset = imageDataToLoad;
    this.mapper.setInputData(this.dataset);

    const range = imageDataToLoad.getPointData().getScalars().getRange();
    updateSlider(this.windowSlider, { min: 0, max: (range[1] - range[0]), value: (range[1] - range[0]) });
    updateSlider(this.levelSlider, { min: range[0], max: range[1], value: range[1] });
    this.updateSliceSlider();

    if (needToAddActor) {
      this.renderer.addActor(this.actor);
    }

    this.render();
  }

  render() {
    this.renderWindow.render();
  }

  resize() {
    if (this.renderWindowContainer) {
      this.boundingRect = this.renderWindowContainer.getBoundingClientRect();
      this.openGlRenderWindow.setSize(this.boundingRect.width, this.boundingRect.height);
      this.render();
    }
  }
}
