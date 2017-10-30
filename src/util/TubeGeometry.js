import vtkMath                    from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyData                from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkConeSource              from 'vtk.js/Sources/Filters/Sources/ConeSource';

export default function createTubeGeometry(mesh) {
  // Fake tube filter which should be properly written in vtk.js
  const source = vtkPolyData.newInstance();
  const mapper = vtkMapper.newInstance();
  const actor = vtkActor.newInstance();

  const cone = vtkConeSource.newInstance();
  cone.setCenter(0, 0, 0);
  cone.setRadius(1);
  cone.setHeight(1);
  cone.update();

  const pts = mesh.map(({ x, y, z, radius }) => [x, y, z, radius]);

  const npoints = cone.getOutputData().getPoints().getData().length / 3;
  const polylen = cone.getOutputData().getPolys().getData().length;
  const points = new Float32Array(npoints * 3 * pts.length);
  const polys = new Float32Array(polylen * pts.length);
  for (let i = 0; i < pts.length; ++i) {
    const [x, y, z, r] = pts[i];
    cone.setCenter(x, y, z);
    cone.setRadius(r);
    if (i === 0) {
      // same direction as the vector between first and secont point
      const [nx, ny, nz] = pts[i + 1];
      cone.setDirection(nx - x, ny - y, nz - z);
      cone.setHeight(2 * Math.sqrt(vtkMath.distance2BetweenPoints(pts[i], pts[i + 1])));
    } else if (i === pts.length - 1) {
      // same direction as the vector between last and second-to-last point
      const [px, py, pz] = pts[i - 1];
      cone.setDirection(x - px, y - py, z - pz);
      cone.setHeight(1);
    } else {
      // average vector between prev and next point
      const [px, py, pz] = pts[i - 1];
      const [nx, ny, nz] = pts[i + 1];
      cone.setDirection(nx - px, ny - py, nz - pz);
      cone.setHeight(2 * Math.sqrt(vtkMath.distance2BetweenPoints(pts[i - 1], pts[i + 1])));
    }
    cone.update();

    points.set(cone.getOutputData().getPoints().getData(), npoints * 3 * i);

    const polyarr = cone.getOutputData().getPolys().getData();
    const polyoffset = polylen * i;
    const indexoffset = npoints * i;
    for (let j = 0; j < polyarr.length;) {
      let n = polyarr[j];
      polys[polyoffset + j] = n;
      for (++j; n > 0; --n, ++j) {
        polys[polyoffset + j] = indexoffset + polyarr[j];
      }
    }
  }

  source.getPoints().setData(points, 3);
  source.getPolys().setData(polys);

  actor.setMapper(mapper);
  mapper.setInputData(source);

  return { actor, mapper, source };
}
