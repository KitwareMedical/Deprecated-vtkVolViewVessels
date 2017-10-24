import React from 'react';
import PropTypes from 'prop-types';

import vtkBoundingBox             from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import ColorMaps                  from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import style from '../Tube.mcss';

const presets = ColorMaps.filter(p => p.RGBPoints).filter(p => p.ColorSpace !== 'CIELAB');

export default class VolumeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      opacityValue: 0,
    };

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

    this.transferFunctionWidget = vtkPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [400, 168] });
    this.transferFunctionWidget.updateStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
      histogramColor: 'rgba(100, 100, 100, 0.5)',
      strokeColor: 'rgb(0, 0, 0)',
      activeColor: 'rgb(255, 255, 255)',
      handleColor: 'rgb(50, 150, 50)',
      buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
      buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
      buttonStrokeColor: 'rgba(0, 0, 0, 1)',
      buttonFillColor: 'rgba(255, 255, 255, 1)',
      strokeWidth: 2,
      activeStrokeWidth: 3,
      buttonStrokeWidth: 1.5,
      handleWidth: 3,
      iconSize: 0,
      padding: 10,
    });
    this.transferFunctionWidget.addGaussian(0.5, 1.0, 0.5, 0.5, 0.4);
    this.transferFunctionWidget.setColorTransferFunction(this.lookupTable);
    this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);
    this.transferFunctionWidget.bindMouseListeners();

    // Manage update when opacity change
    this.transferFunctionWidget.onAnimation((start) => {
      if (start) {
        this.renderWindow.getInteractor().requestAnimation(this.transferFunctionWidget);
      } else {
        this.renderWindow.getInteractor().cancelAnimation(this.transferFunctionWidget);
      }
    });
    this.transferFunctionWidget.onOpacityChange(() => {
      this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);
      if (!this.renderWindow.getInteractor().isAnimating()) {
        this.renderWindow.render();
      }
    });

    // Manage update when lookupTable change
    this.lookupTable.onModified(() => {
      this.transferFunctionWidget.render();
      if (!this.renderWindow.getInteractor().isAnimating()) {
        this.renderWindow.render();
      }
    });
  }

  componentDidMount() {
    this.openGlRenderWindow.setContainer(this.renderWindowContainer);
    this.interactor.initialize();
    this.interactor.bindEvents(this.renderWindowContainer);
    this.resize();
  }

  componentWillReceiveProps(props) {
    if (props.imageData !== this.props.imageData) {
      const needToAddActor = this.props.imageData == null;
      const dataRange = props.imageData.getPointData().getScalars().getRange();

      this.lookupTable.setMappingRange(...dataRange);
      this.lookupTable.updateRange();

      this.transferFunctionWidget.setDataArray(props.imageData.getPointData().getScalars().getData());
      this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);

      this.mapper.setInputData(props.imageData);

      if (needToAddActor) {
        this.renderer.addActor(this.actor);
        this.renderer.resetCamera();
      }

      const maxOpacity = vtkBoundingBox.getDiagonalLength(props.imageData.getBounds());
      this.setState((prevState, _props) => ({ opacityValue: maxOpacity / 15 }));

      this.resize();
    }
  }

  setPiecewiseWidgetContainer(container) {
    this.transferFunctionWidget.setContainer(container);
  }

  resize() {
    if (this.renderWindowContainer) {
      this.boundingRect = this.renderWindowContainer.getBoundingClientRect();
      this.openGlRenderWindow.setSize(this.boundingRect.width, this.boundingRect.height);
      this.renderer.resetCamera();
      this.renderWindow.render();

      if (this.transferFunctionWidget.get('container').container) {
        const rect = this.transferFunctionWidget.get('container').container.getBoundingClientRect();
        this.transferFunctionWidget.setSize(rect.width, rect.height);
        this.lookupTable.modified();
        this.transferFunctionWidget.render();
      }
    }
  }

  updateScalarOpacityUnitDistance() {
    if (this.props.imageData) {
      const value = this.state.opacityValue;
      this.actor.getProperty().setScalarOpacityUnitDistance(0,
        vtkBoundingBox.getDiagonalLength(this.props.imageData.getBounds()) / Math.max(...this.props.imageData.getDimensions()) * 2 * value);
      this.renderWindow.render();
    }
  }

  render() {
    this.updateScalarOpacityUnitDistance();

    return (
      <div className={['js-right-pane', style.itemStretch].join(' ')}>
        <div ref={(r) => { this.renderWindowContainer = r; }} className={['js-renderer', style.itemStretch, style.overflowHidder].join(' ')} />
        <div className={[style.horizontalContainer, style.controlLine].join(' ')}>
          <div className={[style.horizontalContainer, style.controlLine, style.itemStretch].join(' ')}>
            <label className={style.label}>Sampling</label>
            <input className={['js-slider-opacity', style.slider].join(' ')} type="range" min="1" value="25" max="100" />
          </div>
          <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
            <select className={['js-preset', style.itemStretch].join(' ')} />
          </div>
        </div>
      </div>
    );
  }
}

VolumeViewer.propTypes = {
  imageData: PropTypes.object,
};

VolumeViewer.defaultProps = {
  imageData: null,
};


/*
import vtkBoundingBox             from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkPiecewiseGaussianWidget from 'vtk.js/Sources/Interaction/Widgets/PiecewiseGaussianWidget';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import ColorMaps                  from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import style from '../Tube.mcss';

const presets = ColorMaps.filter(p => p.RGBPoints).filter(p => p.ColorSpace !== 'CIELAB');

const htmlTemplate = `
  <div class="js-renderer ${style.itemStretch} ${style.overflowHidder}"></div>
  <div class="${style.horizontalContainer} ${style.controlLine}">
    <div class="${style.horizontalContainer} ${style.controlLine} ${style.itemStretch}">
      <label class="${style.label}">Sampling</label>
      <input class="js-slider-opacity ${style.slider}" type="range" min="1" value="25" max="100" />
    </div>
    <div class="${style.verticalContainer} ${style.itemStretch}">
      <select class="js-preset ${style.itemStretch}"></select>
    </div>
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
    this.presetSelector = container.querySelector('.js-preset');
    this.presetSelector.innerHTML = presets.map(p => `<option value="${p.Name}">${p.Name}</option>`).join('');

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
    this.presetSelector.addEventListener('change', (event) => {
      this.updateColorMap(event.target.value);
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

    if (this.transferFunctionWidget) {
      this.transferFunctionWidget.setDataArray(this.dataset.getPointData().getScalars().getData());
      this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);
    }

    this.mapper.setInputData(this.dataset);

    if (needToAddActor) {
      this.renderer.addActor(this.actor);
      this.renderer.resetCamera();
      this.updateScalarOpacityUnitDistance();
    }

    this.render();
  }

  getPiecewiseFunctionWidget() {
    if (!this.transferFunctionWidget) {
      this.transferFunctionWidget = vtkPiecewiseGaussianWidget.newInstance({ numberOfBins: 256, size: [400, 168] });
      this.transferFunctionWidget.updateStyle({
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        histogramColor: 'rgba(100, 100, 100, 0.5)',
        strokeColor: 'rgb(0, 0, 0)',
        activeColor: 'rgb(255, 255, 255)',
        handleColor: 'rgb(50, 150, 50)',
        buttonDisableFillColor: 'rgba(255, 255, 255, 0.5)',
        buttonDisableStrokeColor: 'rgba(0, 0, 0, 0.5)',
        buttonStrokeColor: 'rgba(0, 0, 0, 1)',
        buttonFillColor: 'rgba(255, 255, 255, 1)',
        strokeWidth: 2,
        activeStrokeWidth: 3,
        buttonStrokeWidth: 1.5,
        handleWidth: 3,
        iconSize: 0,
        padding: 10,
      });
      this.transferFunctionWidget.addGaussian(0.5, 1.0, 0.5, 0.5, 0.4);
      if (this.dataset) {
        const scalars = this.dataset.getPointData().getScalars().getData();
        this.transferFunctionWidget.setDataArray(scalars, scalars.length);
      }
      this.transferFunctionWidget.setColorTransferFunction(this.lookupTable);
      this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);
      this.transferFunctionWidget.bindMouseListeners();

      // Manage update when opacity change
      this.transferFunctionWidget.onAnimation((start) => {
        if (start) {
          this.renderWindow.getInteractor().requestAnimation(this.transferFunctionWidget);
        } else {
          this.renderWindow.getInteractor().cancelAnimation(this.transferFunctionWidget);
        }
      });
      this.transferFunctionWidget.onOpacityChange(() => {
        this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);
        if (!this.renderWindow.getInteractor().isAnimating()) {
          this.renderWindow.render();
        }
      });

      // Manage update when lookupTable change
      this.lookupTable.onModified(() => {
        this.transferFunctionWidget.render();
        if (!this.renderWindow.getInteractor().isAnimating()) {
          this.renderWindow.render();
        }
      });
    }
    return this.transferFunctionWidget;
  }

  updateColorMap(presetName) {
    if (presetName) {
      this.lookupTable.applyColorMap(presets.find(p => (p.Name === presetName)));
    }
    if (this.dataset) {
      const dataRange = this.dataset.getPointData().getScalars().getRange();
      this.lookupTable.setMappingRange(...dataRange);
      this.lookupTable.updateRange();
    }
    if (this.transferFunctionWidget) {
      this.transferFunctionWidget.render();
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

      if (this.transferFunctionWidget) {
        const rect = this.transferFunctionWidget.get('container').container.getBoundingClientRect();
        this.transferFunctionWidget.setSize(rect.width, rect.height);
        this.lookupTable.modified();
        this.transferFunctionWidget.render();
      }
    }
  }
}
*/
