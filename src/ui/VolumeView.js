import React from 'react';
import PropTypes from 'prop-types';

import macro from 'vtk.js/Sources/macro';
import vtkBoundingBox             from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkOpenGLRenderWindow      from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkVolume                  from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper            from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction   from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction       from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkDataArray               from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData                from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';

import style from '../Tube.mcss';

export default class VolumeView extends React.Component {
  constructor(props) {
    super(props);

    this.tubePipelineCache = {};
    this.transferFunctionWidget = null;

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
    this.lookupTable.applyColorMap(props.colorMap);

    this.actor.getProperty().setRGBTransferFunction(0, this.lookupTable);
    this.actor.getProperty().setScalarOpacity(0, this.piecewiseFunction);
    this.actor.getProperty().setInterpolationTypeToFastLinear();

    window.addEventListener('resize', macro.debounce(() => this.resize(), 50));
  }

  componentDidMount() {
    this.openGlRenderWindow.setContainer(this.container);
    this.interactor.initialize();
    this.interactor.bindEvents(this.container);
    this.resize();
  }

  componentWillReceiveProps(props) {
    if (props.imageData !== this.props.imageData) {
      const needToAddActor = this.props.imageData == null;
      const dataRange = props.imageData.getPointData().getScalars().getRange();

      this.lookupTable.setMappingRange(...dataRange);
      this.lookupTable.updateRange();

      if (this.transferFunctionWidget) {
        this.transferFunctionWidget.setDataArray(props.imageData.getPointData().getScalars().getData());
        this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);
      }

      this.mapper.setInputData(props.imageData);

      if (needToAddActor) {
        this.renderer.addActor(this.actor);
        this.renderer.resetCamera();
      }

      this.renderer.resetCamera();
    }

    if (this.props.tubes !== props.tubes) {
      const newCache = {};
      const notInScene = [];
      for (let i = 0; i < props.tubes.length; ++i) {
        const tube = props.tubes[i];
        if (tube.id in this.tubePipelineCache) {
          newCache[tube.id] = this.tubePipelineCache[tube.id];
        } else {
          newCache[tube.id] = this.createPipeline(tube.mesh);
          notInScene.push(tube.id);
        }
      }

      // remove old actors
      for (let i = 0; i < this.props.tubes.length; ++i) {
        const tube = this.props.tubes[i];
        if (!(tube.id in newCache)) {
          this.renderer.removeActor(this.tubePipelineCache[tube.id].actor);
        }
      }

      // show new actors
      notInScene.forEach((id) => {
        this.renderer.addActor(newCache[id].actor);
      });

      // set actor visibility
      for (let i = 0; i < props.tubes.length; ++i) {
        const tube = props.tubes[i];
        newCache[tube.id].actor.setVisibility(tube.visible);
      }

      this.tubePipelineCache = newCache;
    }

    if (props.imageData) {
      const value = vtkBoundingBox.getDiagonalLength(props.imageData.getBounds()) /
        Math.max(...props.imageData.getDimensions()) * 2 * props.scalarOpacity;
      this.actor.getProperty().setScalarOpacityUnitDistance(0, value);
    }

    if (props.colorMap !== this.props.colorMap) {
      this.lookupTable.applyColorMap(props.colorMap);
      if (props.imageData) {
        const dataRange = props.imageData.getPointData().getScalars().getRange();
        this.lookupTable.setMappingRange(...dataRange);
        this.lookupTable.updateRange();
      }
      if (this.transferFunctionWidget) {
        this.transferFunctionWidget.render();
      }
    }

    this.renderWindow.render();
  }

  setTransferFunctionWidget(widget) {
    this.transferFunctionWidget = widget;

    this.transferFunctionWidget.setColorTransferFunction(this.lookupTable);
    this.transferFunctionWidget.applyOpacity(this.piecewiseFunction);

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
    if (this.container) {
      const boundingRect = this.container.getBoundingClientRect();
      this.openGlRenderWindow.setSize(boundingRect.width, boundingRect.height);
      this.renderer.resetCamera();
      this.renderWindow.render();

      if (this.transferFunctionWidget) {
        this.lookupTable.modified();
        this.transferFunctionWidget.render();
      }
    }
  }

  render() {
    return (
      <div ref={(r) => { this.container = r; }} className={[style.itemStretch, style.overflowHidder].join(' ')} />
    );
  }
}

VolumeView.propTypes = {
  colorMap: PropTypes.object.isRequired,
  scalarOpacity: PropTypes.number,
  imageData: PropTypes.object,
  tubes: PropTypes.array,
};

VolumeView.defaultProps = {
  scalarOpacity: 0,
  imageData: null,
  tubes: [],
};
