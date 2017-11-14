import { expect } from 'chai';

import { addTube } from '../src/stores/TubeStore';

const createData = () => ({
  tubeOrder: [],
  tubes: {
  },
  selection: {
    keys: [],
    rows: [],
  },
});

describe('TubeStore', () => {

  describe('#addTube', () => {

    it('should add pending tube', () => {
      const tube = {
        id: 10,
        mesh: null,
        status: 'pending',
        parent: -1,
        color: [1, 0, 0],
      };
      let data = createData();

      data = addTube(tube)(data);

      // craft correct object
      const correct = createData();
      correct.tubeOrder.push(tube.id);
      correct.tubes[tube.id] = Object.assign({}, tube);
      correct.tubes[tube.id].visible = true;

      expect(data).to.deep.equal(correct);
    });

    it('should add done tube', () => {
      const tube = {
        id: 10,
        mesh: [],
        status: 'done',
        parent: -1,
        color: [1, 0, 0],
      };
      let data = createData();

      data = addTube(tube)(data);

      // craft correct object
      const correct = createData();
      correct.tubeOrder.push(tube.id);
      correct.tubes[tube.id] = Object.assign({}, tube);
      correct.tubes[tube.id].visible = true;

      expect(data).to.deep.equal(correct);
    });

    it('should fail to add done tube without mesh', () => {
      const tube = {
        id: 10,
        mesh: null,
        status: 'done',
        parent: -1,
        color: [1, 0, 0],
      };
      const data = createData();
      const result = addTube(tube)(data);

      expect(data).to.deep.equal(result);
    });

  });

  describe('#addTubeBulk', () => {});

  describe('#deleteTube', () => {});

  describe('#updateTube', () => {});

  describe('#setTubeVisibility', () => {});

  describe('#setTubeColor', () => {});

  describe('#reparentTubes', () => {});

  describe('#setSelection', () => {});
});
