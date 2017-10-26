import React from 'react';
import PropTypes from 'prop-types';

import { Button, Slider } from 'antd';

import vtkPicker                      from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkImageMapper                 from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice                  from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow          from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
// import vtkPickerInteractorStyle   from 'vtk.js/Sources/Rendering/Core/CellPicker/example/PickerInteractorStyle';
import vtkRenderer                    from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow                from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor      from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import vtkTubePickerInteractorStyle   from '../util/TubePickerInteractorStyle';

import LabeledSlider from './components/LabeledSlider';
import style from '../Tube.mcss';

export default class SliceViewer extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      windowMin: 0,
      windowMax: 10,
      windowValue: 0,

      levelMin: 0,
      levelMax: 10,
      levelValue: 0,

      sliceMode: 2, // Z normal
      slice: 0,
      sliceMax: 0,
    };

    // Create vtk.js rendering pieces
    this.renderWindow = vtkRenderWindow.newInstance();
    this.renderer = vtkRenderer.newInstance();
    this.renderWindow.addRenderer(this.renderer);
    this.openGlRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.renderWindow.addView(this.openGlRenderWindow);
    this.interactor = vtkRenderWindowInteractor.newInstance();
    this.interactor.setView(this.openGlRenderWindow);

    this.actor = vtkImageSlice.newInstance();
    this.mapper = vtkImageMapper.newInstance(); // { renderToRectangle: true }
    this.actor.setMapper(this.mapper);
    this.camera = this.renderer.getActiveCamera();
    this.camera.setParallelProjection(true);

    // Setup picking
    this.picker = vtkPicker.newInstance();
    this.picker.setPickFromList(true);
    this.picker.initializePickList();
    this.picker.addPickList(this.actor);

    this.iStyle = vtkTubePickerInteractorStyle.newInstance();
    this.renderWindow.getInteractor().setInteractorStyle(this.iStyle);
    this.renderWindow.getInteractor().setPicker(this.picker);

    // Add pick listener
    this.picker.onPickChange(() => {
      const { actors, cellIJK } = this.picker.get('cellIJK', 'actors');
      if (actors.length && this.props.onPickIJK) {
        this.props.onPickIJK(...cellIJK);
      }
    });

    // Synch UI based on prop change
    this.actor.getProperty().onModified(() => {
      const { colorWindow, colorLevel } = this.actor.getProperty().get('colorWindow', 'colorLevel');
      this.setState((prevState, _props) => ({ windowValue: colorWindow, levelValue: colorLevel }));
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
      this.mapper.setInputData(props.imageData);

      const range = props.imageData.getPointData().getScalars().getRange();
      this.setState((prevState, _props) => ({
        windowMin: 0,
        windowMax: (range[1] - range[0]),
        windowValue: (range[1] - range[0]),
        levelMin: range[0],
        levelMax: range[1],
        levelValue: (range[1] + range[0]) * 0.5,
      }));

      if (needToAddActor) {
        this.renderer.addActor(this.actor);
        this.mapper.setCurrentSlicingMode(this.state.sliceMode);
        this.mapper.setZSlice(0);
        const position = this.camera.getFocalPoint().map((v, idx) => (idx === this.state.sliceMode ? (v + 1) : v));
        const viewUp = [0, 0, 0];
        viewUp[(this.state.sliceMode + 2) % 3] = 1;
        this.camera.set({ position, viewUp });
        this.renderer.resetCamera();
        this.renderer.resetCameraClippingRange();
        this.updateRenderer();
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.windowValue !== this.state.windowValue) {
      this.actor.getProperty().setColorWindow(this.state.windowValue);
      this.updateRenderer();
    }

    if (prevState.levelValue !== this.state.levelValue) {
      this.actor.getProperty().setColorLevel(this.state.levelValue);
      this.updateRenderer();
    }

    if (prevState.slice !== this.state.slice) {
      this.mapper[`set${'XYZ'[this.state.sliceMode]}Slice`](this.state.slice);
      this.updateRenderer();
    }

    if (prevState.sliceMode !== this.state.sliceMode) {
      this.mapper.setCurrentSlicingMode(this.state.sliceMode);
      // this.mapper[`set${'XYZ'[this.state.sliceMode]}Slice`](0); // FIXME force change to render (bug in imageMapper)

      const position = this.camera.getFocalPoint().map((v, idx) => (idx === this.state.sliceMode ? (v + 1) : v));
      const viewUp = [0, 0, 0];
      viewUp[(this.state.sliceMode + 2) % 3] = 1;
      this.camera.set({ position, viewUp });
      this.renderer.resetCamera();
      this.renderer.resetCameraClippingRange();
      this.resetSliceSlider();
      this.updateRenderer();
    }


    if (prevProps.imageData !== this.props.imageData) {
      this.resetSliceSlider();
      this.updateRenderer();
    }
  }

  onLevelChanged(levelValue) {
    this.setState((prevState, props) => ({ levelValue }));
  }

  onWindowChanged(windowValue) {
    this.setState((prevState, props) => ({ windowValue }));
  }

  onSliceChanged(slice) {
    this.setState((prevState, props) => ({ slice }));
  }

  onSliceNormalChanged(sliceMode) {
    this.setState((prevState, props) => ({ sliceMode }));
  }

  resize() {
    if (this.renderWindowContainer) {
      this.boundingRect = this.renderWindowContainer.getBoundingClientRect();
      this.openGlRenderWindow.setSize(this.boundingRect.width, this.boundingRect.height);
      this.renderer.resetCamera();
      this.renderer.resetCameraClippingRange();
      this.updateRenderer();
    }
  }

  updateRenderer() {
    this.renderWindow.render();
  }

  resetSliceSlider() {
    const max = this.props.imageData.getDimensions()[this.state.sliceMode] - 1;
    const value = Math.ceil(max / 2);
    this.setState((prevState, props) => ({ sliceMax: max, slice: value }));
  }

  render() {
    return (
      <div className={['js-left-pane', style.verticalContainer, style.itemStretch].join(' ')}>
        <div ref={(r) => { this.renderWindowContainer = r; }} className={['js-renderer', style.itemStretch, style.overflowHidder].join(' ')} />
        <div className={[style.horizontalContainer, style.controlLine].join(' ')}>
          <label className={style.label}>Window</label>
          <Slider
            className={['js-slider-window', style.slider].join(' ')}
            min={this.state.windowMin}
            value={this.state.windowValue}
            max={this.state.windowMax}
            onChange={value => this.onWindowChanged(value)}
          />
          <label className={style.label}>Level</label>
          <Slider
            className={['js-slider-level', style.slider].join(' ')}
            min={this.state.levelMin}
            value={this.state.levelValue}
            max={this.state.levelMax}
            onChange={value => this.onLevelChanged(value)}
          />
        </div>
        <div className={[style.horizontalContainer, style.controlLine].join(' ')}>
          <Button className={['js-slice-normal-button', style.button].join(' ')} onClick={ev => this.onSliceNormalChanged(0)}>X</Button>
          <Button className={['js-slice-normal-button', style.button].join(' ')} onClick={ev => this.onSliceNormalChanged(1)}>Y</Button>
          <Button className={['js-slice-normal-button', style.button].join(' ')} onClick={ev => this.onSliceNormalChanged(2)}>Z</Button>
          <LabeledSlider
            className={style.slider}
            min={0}
            value={this.state.slice}
            max={this.state.sliceMax}
            onChange={value => this.onSliceChanged(value)}
          />
        </div>
      </div>
    );
  }
}

SliceViewer.propTypes = {
  onPickIJK: PropTypes.func,
  imageData: PropTypes.object,
};

SliceViewer.defaultProps = {
  onPickIJK: null,
  imageData: null,
};
