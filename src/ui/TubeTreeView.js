import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import { Spin, Button, Table } from 'antd';

import style from '../Tube.mcss';

import PopupColorPicker from './PopupColorPicker';

@observer
class Container extends React.Component {
  static propTypes = {
    stores: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = this.initialState;
  }

  get initialState() {
    return {
      selection: {
        keys: [],
        rows: [],
      },
    };
  }

  createTubeTree(tubes) {
    const keys = tubes.keys();

    // shallow copy tubes
    const tubesCopy = {};
    for (let i = 0; i < keys.length; ++i) {
      const id = keys[i];
      tubesCopy[id] = Object.assign({}, tubes.get(id));
    }

    // assign children
    for (let i = 0; i < keys.length; ++i) {
      const id = keys[i];
      const tube = tubesCopy[id];
      if (tube.parent !== -1) {
        const parent = tubesCopy[tube.parent];
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(tube);
      }
    }

    // create tree as ordered list, with only tubes that have no parents
    const tree = keys
      .filter(id => tubesCopy[id].parent === -1)
      .map(id => tubesCopy[id]);

    return tree;
  }

  render() {
    const { stores: { tubeStore } } = this.props;
    const { selection } = this.state;
    const tubeTree = this.createTubeTree(tubeStore.tubes);
    return (
      <TubeTreeView
        tubeTree={tubeTree}
        selection={selection}
        onVisibilityChange={(id, visible) => tubeStore.setTubeVisibility(id, visible)}
        onColorChange={(id, color) => tubeStore.setTubeColor(id, color)}
        onDelete={id => tubeStore.deleteTube(id)}
        onReparent={(parent) => {
          tubeStore.reparent(parent, this.state.selection.rows.map(t => t.id));
          // clear selection
          this.setState({ selection: { keys: [], rows: [] } });
        }}
        onSelectionChange={(keys, rows) => this.setState({ selection: { keys, rows } })}
      />
    );
  }
}

export default Container;

function TubeTreeView({
  tubeTree,
  selection,
  onColorChange,
  onVisibilityChange,
  onDelete,
  onReparent,
  onSelectionChange,
}) {
  const makeTubeControls = (color, visible, changeColor, changeVisible, deleteTube) => (
    <span>
      <PopupColorPicker
        color={color}
        onChange={rgb => changeColor(rgb)}
      />
      <span className="ant-divider" />
      <Button onClick={changeVisible}>
        <i className={visible ? 'fa fa-eye' : 'fa fa-eye-slash'} />
      </Button>
      <span className="ant-divider" />
      <Button onClick={deleteTube}>
        <i className="fa fa-trash" />
      </Button>
    </span>
  );

  const makeReparentButton = reparentTubes => (
    <Button onClick={reparentTubes}>
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
              rgb => onColorChange(tube.id, [rgb.r / 255, rgb.g / 255, rgb.b / 255]),
              // onVisibilityChange
              () => onVisibilityChange(tube.id, !tube.visible),
              // onDelete
              () => onDelete(tube.id),
            );
          }

          // selection exists, so show reparent button
          return makeReparentButton(() => onReparent(tube.id));
        }
        // tube is pending, so show spinner
        return <Spin />;
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys: selection.keys,
    onChange: onSelectionChange,
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
  tubeTree: PropTypes.array.isRequired,
  selection: PropTypes.shape({
    keys: PropTypes.array.isRequired,
    rows: PropTypes.array.isRequired,
  }).isRequired,

  onColorChange: PropTypes.func,
  onVisibilityChange: PropTypes.func,
  onDelete: PropTypes.func,
  onReparent: PropTypes.func,
  onSelectionChange: PropTypes.func,
};

TubeTreeView.defaultProps = {
  onColorChange: () => {},
  onVisibilityChange: () => {},
  onDelete: () => {},
  onReparent: () => {},
  onSelectionChange: () => {},
};
