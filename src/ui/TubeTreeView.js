import React from 'react';
import PropTypes from 'prop-types';

import { Spin, Button, Table } from 'antd';

import { connectComponent } from '../state';
import style from '../Tube.mcss';

import { setTubeVisibility, setTubeColor, deleteTube, reparentTubes, setSelection } from '../stores/TubeStore';

import PopupColorPicker from './PopupColorPicker';

function convertToTree(tubes) {
  // NOTE: maybe don't recreate this every update.

  // Make a copy so we don't pollute the original tube object.
  const tubesCopy = tubes.map(tube => Object.assign({}, tube));

  // fast tube lookup
  // use references so we can modify the tube metadata
  const tubeLookup = tubesCopy.reduce((lookup, tube) => {
    lookup[tube.id] = tube;
    return lookup;
  }, {});

  // init tree with top-level nodes
  const tree = tubesCopy.filter(tube => tube.parent === -1);

  // construct the tree
  for (let i = 0; i < tubesCopy.length; ++i) {
    if (tubesCopy[i].parent !== -1) {
      const parentTube = tubeLookup[tubesCopy[i].parent];
      // make children array if it doesn't exist
      if (parentTube.children === undefined) {
        parentTube.children = [];
      }
      parentTube.children.push(tubesCopy[i]);
    }
  }

  return tree;
}

function TubeTreeView({
  stores: { tubeStore },
  tubes,
  selection,
}) {
  const tubeTree = convertToTree(tubes);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '# of points',
      dataIndex: 'mesh',
      render: (mesh, tube) => (tube.status === 'done' && mesh ? mesh.length : '-'),
    },
    {
      title: '',
      dataIndex: '',
      render: (_, tube) => (
        tube.status === 'done' ?
          <span>
            <PopupColorPicker
              color={tube.color.map(c => c * 255)}
              onChange={rgb => tubeStore.dispatch(setTubeColor(tube.id, rgb))}
            />
            <span className="ant-divider" />
            <Button onClick={() => tubeStore.dispatch(setTubeVisibility(tube.id, !tube.visible))}>
              <i className={tube.visible ? 'fa fa-eye' : 'fa fa-eye-slash'} />
            </Button>
            <span className="ant-divider" />
            <Button onClick={() => tubeStore.dispatch(deleteTube(tube.id))}>
              <i className="fa fa-trash" />
            </Button>
            <span className="ant-divider" />
            { selection.keys.length > 0 ?
              <a href="#!" onClick={(ev) => { tubeStore.dispatch(reparentTubes(tube.id)); ev.preventDefault(); }}>
                Make parent
              </a>
              :
              null
            }
          </span>
          :
          <Spin />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selection.keys,
    onChange: (keys, rows) => tubeStore.dispatch(setSelection(keys, rows)),
  };

  return (
    <div className={[style.verticalContainer, style.itemStretch, style.border].join(' ')}>
      <div className={[style.itemStretch, style.overflowScroll].join(' ')}>
        <Table
          rowKey="id"
          pagination={false}
          columns={columns}
          dataSource={tubeTree}
          rowSelection={rowSelection}
        />
      </div>
    </div>
  );
}

TubeTreeView.propTypes = {
  tubes: PropTypes.array,
  selection: PropTypes.shape({
    keys: PropTypes.array,
    rows: PropTypes.array,
  }),

  stores: PropTypes.object.isRequired,
};

TubeTreeView.defaultProps = {
  tubes: [],
  selection: {
    keys: [],
    rows: [],
  },
};

export default connectComponent(TubeTreeView, 'tubeStore', ({ tubeStore }, props) => ({
  tubes: tubeStore.tubeOrder.map(id => tubeStore.tubes[id]),
  selection: tubeStore.selection,
}));
