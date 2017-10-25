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
import vtkDataArray               from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData                from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import ColorMaps                  from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps.json';

import style from '../Tube.mcss';

const presets = ColorMaps
  .filter(p => p.RGBPoints)
  .filter(p => p.ColorSpace !== 'CIELAB')
  .sort((a, b) => a.Name.localeCompare(b.Name))
  .filter((p, i, arr) => !i || p.Name !== arr[i - 1].Name);

export default class VolumeViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      opacityValue: 25,
      colorMap: presets[0].Name,
    };

    this.tubePipelineCache = {};

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
    // Synced with initial state
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

  componentDidUpdate(prevProps, prevState) {
    if (prevState.opacityValue !== this.state.opacityValue) {
      this.updateScalarOpacityUnitDistance();
    }

    if (prevState.colorMap !== this.state.colorMap) {
      this.lookupTable.applyColorMap(presets.find(p => (p.Name === this.state.colorMap)));
      if (this.props.imageData) {
        const dataRange = this.props.imageData.getPointData().getScalars().getRange();
        this.lookupTable.setMappingRange(...dataRange);
        this.lookupTable.updateRange();
      }
      if (this.transferFunctionWidget) {
        this.transferFunctionWidget.render();
      }
      this.renderWindow.render();
    }

    if (prevProps.tubes !== this.props.tubes) {
      const newCache = {};
      const notInScene = [];
      for (let i = 0; i < this.props.tubes.length; ++i) {
        const tube = this.props.tubes[i];
        if (tube.id in this.tubePipelineCache) {
          newCache[tube.id] = this.tubePipelineCache[tube.id];
        } else {
          newCache[tube.id] = this.createPipeline(tube.mesh);
          notInScene.push(tube.id);
        }
      }

      // remove old actors
      for (let i = 0; i < prevProps.tubes.length; ++i) {
        const tube = prevProps.tubes[i];
        if (!(tube.id in newCache)) {
          this.renderer.removeActor(this.tubePipelineCache[tube.id].actor);
        }
      }

      // show new actors
      notInScene.forEach((id) => {
        this.renderer.addActor(newCache[id].actor);
      });

      this.tubePipelineCache = newCache;
      this.renderWindow.render();
    }
  }

  onColorMapChange() {
    this.setState((prevState, props) => ({ colorMap: this.presetSelector.value }));
  }

  setPiecewiseWidgetContainer(container) {
    this.transferFunctionWidget.setContainer(container);
  }

  createPipeline(metadata) {
    // Fake tube filter which should be properly written in vtk.js
    const source = vtkPolyData.newInstance();
    const mapper = vtkMapper.newInstance();
    const actor = vtkActor.newInstance();

    // Standard line + radius data
    const size = metadata.length;
    const coords = new Float32Array(size * 3);
    const radiusArray = new Float32Array(size);
    const cell = new Uint16Array(size + 1);

    cell[0] = size;
    metadata.forEach(({ x, y, z, radius }, index) => {
      coords[(index * 3) + 0] = x;
      coords[(index * 3) + 1] = y;
      coords[(index * 3) + 2] = z;
      radiusArray[index] = radius;
      cell[index + 1] = index;
    });
    source.getPoints().setData(coords, 3);
    source.getLines().setData(cell);
    source.getPointData().setScalars(vtkDataArray.newInstance({ name: 'radius', values: radiusArray }));

    // Generate tube directly
    // const nbSides = 6;
    // const nbPoints = metadata.length * nbSides;
    // const nbPolys = (metadata.length - 1) * (nbSides - 1);
    // const coords = new Float32Array(nbPoints * 3);
    // const cell = new Uint16Array(nbPolys + 1);
    // const radiusArray = new Float32Array(nbPoints);
    // const coneSourceHelper = vtkConeSource.newInstance({ height: 0, capping: false, resolution: nbSides });
    // cell[0] = nbPolys;
    // let cellOffset = 1;
    // metadata.forEach(({ x, y, z, radius }, index, array) => {
    //   coneSourceHelper.setCenter(x, y, z);
    //   coneSourceHelper.setRadius(radius);

    //   if (index + 1 < array.length) {
    //     coneSourceHelper.setDirection(array[index + 1].x - x, array[index + 1].y - y, array[index + 1].z - z);
    //   } else {
    //     coneSourceHelper.setDirection(x - array[index - 1].x, y - array[index - 1].y, z - array[index - 1].z);
    //   }
    //   coneSourceHelper.update();
    //   coords.set(new Float32Array(coneSourceHelper.getOutputData().getPoints().getData().buffer, 4 * 3), index * 3); // Skip first point

    //   if (index > 0) {
    //     for (let i = 1; i < nbSides; i++) {
    //       cell[cellOffset++] = ((index - 1) * nbSides) + i - 1;
    //       cell[cellOffset++] = ((index - 1) * nbSides) + i;
    //       cell[cellOffset++] = ((index) * nbSides) + i;
    //       cell[cellOffset++] = ((index) * nbSides) + i - 1;
    //     }
    //   }
    //   for (let i = 0; i < nbSides; i++) {
    //     radiusArray[(index * nbSides) + i] = radius;
    //   }
    // });
    // source.getPoints().setData(coords, 3);
    // source.getPolys().setData(cell);
    // source.getPointData().setScalars(vtkDataArray.newInstance({ name: 'radius', values: radiusArray }));

    actor.setMapper(mapper);
    mapper.setInputData(source);

    return { actor, mapper, source };
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
    const presetElms = presets.map(p => <option key={p.Name} value={p.Name}>{p.Name}</option>);

    return (
      <div className={['js-right-pane', style.itemStretch].join(' ')}>
        <div ref={(r) => { this.renderWindowContainer = r; }} className={['js-renderer', style.itemStretch, style.overflowHidder].join(' ')} />
        <div className={[style.horizontalContainer, style.controlLine].join(' ')}>
          <div className={[style.horizontalContainer, style.controlLine, style.itemStretch].join(' ')}>
            <label className={style.label}>Sampling</label>
            <input
              className={['js-slider-opacity', style.slider].join(' ')}
              type="range"
              min="1"
              value={this.state.opacityValue}
              max="100"
              onInput={ev => this.setState({ opacityValue: ev.target.value })}
            />
          </div>
          <div className={[style.verticalContainer, style.itemStretch].join(' ')}>
            <select
              ref={(r) => { this.presetSelector = r; }}
              className={['js-preset', style.itemStretch].join(' ')}
              onChange={ev => this.onColorMapChange()}
            >
              {presetElms}
            </select>
          </div>
        </div>
      </div>
    );
  }
}

VolumeViewer.propTypes = {
  imageData: PropTypes.object,
  tubes: PropTypes.array,
};

VolumeViewer.defaultProps = {
  imageData: null,
  tubes: [],
};
