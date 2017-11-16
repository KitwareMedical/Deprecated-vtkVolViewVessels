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

  const makeTubeControls = (color, visible, onColorChange, onVisibilityChange, onDelete) => (
    <span>
      <PopupColorPicker
        color={color}
        onChange={rgb => onColorChange(rgb)}
      />
      <span className="ant-divider" />
      <Button onClick={() => onVisibilityChange()}>
        <i className={visible ? 'fa fa-eye' : 'fa fa-eye-slash'} />
      </Button>
      <span className="ant-divider" />
      <Button onClick={() => onDelete()}>
        <i className="fa fa-trash" />
      </Button>
    </span>
  );

  const makeReparentButton = onReparent => (
    <Button onClick={() => onReparent()}>
      Make parent
    </Button>
  );

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
      render: (_, tube) => {
        if (tube.status === 'done') {
          // no selection, so make standard tube controls
          if (selection.keys.length === 0) {
            return makeTubeControls(
              tube.color.map(c => c * 255),
              tube.visible,
              // onColorChange
              rgb => tubeStore.dispatch(setTubeColor(tube.id, [rgb.r / 255, rgb.g / 255, rgb.b / 255])),
              // onVisibilityChange
              () => tubeStore.dispatch(setTubeVisibility(tube.id, !tube.visible)),
              // onDelete
              () => tubeStore.dispatch(deleteTube(tube.id)),
            );
          }

          // selection exists, so show reparent button
          return makeReparentButton(
            () => tubeStore.dispatch(reparentTubes(tube.id)),
          );
        }
        // tube is pending, so show spinner
        return <Spin />;
      },
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
