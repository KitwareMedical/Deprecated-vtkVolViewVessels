import React from 'react';
import PropTypes from 'prop-types';

import macro from 'vtk.js/Sources/macro';
import vtkPicker                      from 'vtk.js/Sources/Rendering/Core/CellPicker';
import vtkImageMapper                 from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice                  from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkOpenGLRenderWindow          from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
// import vtkPickerInteractorStyle   from 'vtk.js/Sources/Rendering/Core/CellPicker/example/PickerInteractorStyle';
import vtkRenderer                    from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow                from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor      from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import vtkTubePickerInteractorStyle   from '../util/TubePickerInteractorStyle';

import style from '../Tube.mcss';

export default class SliceView extends React.Component {
  constructor(props) {
    super(props);

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
      if (actors.length) {
        this.props.onPickIJK(...cellIJK);
      }
    });

    // Synch UI based on prop change
    this.actor.getProperty().onModified(() => {
      const { colorWindow, colorLevel } = this.actor.getProperty().get('colorWindow', 'colorLevel');
      this.props.onWindowLevelChange(colorWindow, colorLevel);
    });

    window.addEventListener('resize', macro.debounce(() => this.resize(), 50));
  }

  componentDidMount() {
    this.openGlRenderWindow.setContainer(this.container);
    this.interactor.initialize();
    this.interactor.bindEvents(this.container);
    this.resize();
  }

  componentWillReceiveProps(props) {
    // flag used to update slice mode if needed
    let updateSliceMode = false;

    if (props.imageData !== this.props.imageData) {
      const needToAddActor = this.props.imageData == null;
      this.mapper.setInputData(props.imageData);

      // set actor properties
      const [scalarMin, scalarMax] = props.imageData.getPointData().getScalars().getRange();
      this.actor.getProperty().setColorWindow(scalarMax - scalarMin);
      this.actor.getProperty().setColorLevel((scalarMax + scalarMin) / 2.0);

      if (needToAddActor) {
        this.renderer.addActor(this.actor);
        updateSliceMode = true;
      }
    }

    // update slice mode
    if (props.sliceMode !== this.props.sliceMode || updateSliceMode) {
      this.mapper.setCurrentSlicingMode(props.sliceMode);
      // this.mapper[`set${'XYZ'[this.props.sliceMode]}Slice`](0); // FIXME force change to render (bug in imageMapper)
      // this.mapper.setZSlice(0);
      const position = this.camera.getFocalPoint().map((v, idx) => (idx === props.sliceMode ? (v + 1) : v));
      const viewUp = [0, 0, 0];
      viewUp[(props.sliceMode + 2) % 3] = 1;
      this.camera.set({ position, viewUp });
      this.renderer.resetCamera();
      this.renderer.resetCameraClippingRange();
    }

    // update slice
    this.mapper[`set${'XYZ'[this.props.sliceMode]}Slice`](props.slice);

    // render
    this.renderWindow.render();
  }

  resize() {
    if (this.container) {
      const boundingRect = this.container.getBoundingClientRect();
      this.openGlRenderWindow.setSize(boundingRect.width, boundingRect.height);
      this.renderer.resetCamera();
      this.renderer.resetCameraClippingRange();
      this.renderWindow.render();
    }
  }

  render() {
    return (
      <div ref={(r) => { this.container = r; }} className={[style.itemStretch, style.overflowHidder].join(' ')} />
    );
  }
}

SliceView.propTypes = {
  sliceMode: PropTypes.number.isRequired,
  slice: PropTypes.number.isRequired,
  imageData: PropTypes.object,
  onPickIJK: PropTypes.func,
  onWindowLevelChange: PropTypes.func,
};

SliceView.defaultProps = {
  imageData: null,
  onPickIJK: () => {},
  onWindowLevelChange: () => {},
};
