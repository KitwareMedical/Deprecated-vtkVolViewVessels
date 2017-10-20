import macro                   from 'vtk.js/Sources/macro';
import vtkInteractorStyleImage from 'vtk.js/Sources/Interaction/Style/InteractorStyleImage';
import vtkSphereSource         from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor                from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper               from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// vtkTubePickerInteractorStyle methods
// ----------------------------------------------------------------------------
function vtkTubePickerInteractorStyle(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTubePickerInteractorStyle');

  // Capture "parentClass" api for internal use
  const superClass = Object.assign({}, publicAPI);
  let time = 0;

  publicAPI.handleLeftButtonRelease = () => {
    if ((+new Date()) - time < 200) {
      const pos = model.interactor.getEventPosition(model.interactor.getPointerIndex());
      publicAPI.findPokedRenderer(pos.x, pos.y);
      if (model.currentRenderer === null) {
        return;
      }

      const renderer = model.currentRenderer;
      const interactor = model.interactor;
      const point = [pos.x, pos.y, 0.0];
      interactor.getPicker().pick(point, renderer);

      // Display picked position
      const pickPosition = interactor.getPicker().getPickPosition();
      const sphere = vtkSphereSource.newInstance();
      sphere.setCenter(pickPosition);
      sphere.setRadius(0.01);
      const mapper = vtkMapper.newInstance();
      mapper.setInputData(sphere.getOutputData());
      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);
      actor.getProperty().setColor(1.0, 0.0, 0.0);
      model.currentRenderer.addActor(actor);

      // Display picked point from an actor
      const pickedPoint = interactor.getPicker().getPickedPositions();
      for (let i = 0; i < pickedPoint.length; i++) {
        const s = vtkSphereSource.newInstance();
        s.setCenter(pickedPoint[i]);
        s.setRadius(0.01);
        const m = vtkMapper.newInstance();
        m.setInputData(s.getOutputData());
        const a = vtkActor.newInstance();
        a.setMapper(m);
        a.getProperty().setColor(1.0, 1.0, 0.0);
        model.currentRenderer.addActor(a);
      }
      model.interactor.render();
    }
    superClass.handleLeftButtonRelease();
  };

  publicAPI.handleLeftButtonPress = () => {
    time = (+new Date());
    superClass.handleLeftButtonPress();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------
const DEFAULT_VALUES = {

};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorStyleImage.extend(publicAPI, model, initialValues);


  // Object specific methods
  vtkTubePickerInteractorStyle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTubePickerInteractorStyle');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
