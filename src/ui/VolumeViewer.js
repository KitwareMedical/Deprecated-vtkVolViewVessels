import vtkBoundingBox             from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import ColorMaps                  from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import style from '../Tube.mcss';

const presets = ColorMaps.filter(p => p.RGBPoints).filter(p => p.ColorSpace !== 'CIELAB');

const htmlTemplate = `
  <div class="js-renderer ${style.itemStretch} ${style.overflowHidder}"></div>
  <div class="${style.horizontalContainer} ${style.controlLine}">
    <label class="${style.label}">Sampling</label>
    <input class="js-slider-opacity ${style.slider}" type="range" min="1" value="25" max="100" />
  </div>
`;

export default class VolumeViewer {
  constructor(container) {
    this.meshes = {};
    this.root = container;
    container.classList.add(style.verticalContainer);
    container.innerHTML = htmlTemplate;

    this.renderWindowContainer = container.querySelector('.js-renderer');
    this.opacitySlider = container.querySelector('.js-slider-opacity');

    // Create vtk.js rendering pieces
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);
    this.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.renderWindow.addView(this.openGlRenderWindow);
    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.interactor.setView(this.openGlRenderWindow);
    this.actor = vtkVolume.newInstance();
    this.mapper = vtkVolumeMapper.newInstance();
    this.actor.setMapper(this.mapper);
    this.camera = this.renderer.getActiveCamera();

    this.piecewiseFunction = vtkPiecewiseFunction.newInstance();
    this.lookupTable = vtkColorTransferFunction.newInstance();

    this.lookupTable.applyColorMap(presets[0]);

    this.actor.getProperty().setRGBTransferFunction(0, this.lookupTable);
    this.actor.getProperty().setScalarOpacity(0, this.piecewiseFunction);
    this.actor.getProperty().setInterpolationTypeToFastLinear();

    this.openGlRenderWindow.setContainer(this.renderWindowContainer);
    this.interactor.initialize();
    this.interactor.bindEvents(this.renderWindowContainer);
    this.resize();

    // Add DOM listeners
    this.opacitySlider.addEventListener('input', (event) => {
      if (this.dataset) {
        this.updateScalarOpacityUnitDistance();
      }
    });
  }

  updateScalarOpacityUnitDistance() {
    const value = Number(this.opacitySlider.value);
    this.actor.getProperty().setScalarOpacityUnitDistance(0,
      vtkBoundingBox.getDiagonalLength(this.dataset.getBounds()) / Math.max(...this.dataset.getDimensions()) * 2 * value);
    this.render();
  }

  updateData(imageDataToLoad) {
    const needToAddActor = !this.dataset;
    this.dataset = imageDataToLoad;
    const dataRange = this.dataset.getPointData().getScalars().getRange();

    this.lookupTable.setMappingRange(...dataRange);
    this.lookupTable.updateRange();

    this.piecewiseFunction.removeAllPoints();
    this.piecewiseFunction.addPoint(dataRange[0], 0);
    this.piecewiseFunction.addPoint(dataRange[1], 1);

    this.mapper.setInputData(this.dataset);

    if (needToAddActor) {
      this.renderer.addActor(this.actor);
      this.renderer.resetCamera();
      this.updateScalarOpacityUnitDistance();
    }

    this.render();
  }

  addGeometry(id, pipeline) {
    this.meshes[id] = pipeline;
    this.renderer.addActor(pipeline.actor);
    this.render();
  }

  removeGeometry(id) {
    this.renderer.removeActor(this.meshes[id].actor);
    this.render();
  }

  updateGeometryVisibility(id, visibility) {
    this.meshes[id].actor.setVisibility(visibility);
    this.render();
  }

  render() {
    this.renderWindow.render();
  }

  resize() {
    if (this.renderWindowContainer) {
      this.boundingRect = this.renderWindowContainer.getBoundingClientRect();
      this.openGlRenderWindow.setSize(this.boundingRect.width, this.boundingRect.height);
      this.renderer.resetCamera();
      this.render();
    }
  }
}
