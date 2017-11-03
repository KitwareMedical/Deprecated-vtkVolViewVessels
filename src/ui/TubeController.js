import React from 'react';
import PropTypes from 'prop-types';

import { notification as Notification, Spin, Button, Table } from 'antd';

import LabeledSlider from './components/LabeledSlider';
import PopupColorPicker from './PopupColorPicker';
import style from '../Tube.mcss';

export default class TubeController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 2,

      tubeTree: [],

      selectedRowKeys: [],
      selection: [],
    };
  }

  componentWillReceiveProps(props) {
    if (this.props.tubes !== props.tubes) {
      // NOTE: maybe don't recreate this every update.

      // make a copy so we don't pollute the original tube object
      const tubesCopy = props.tubes.map(tube => Object.assign({}, tube));

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

      this.setState({ tubeTree: tree });
    }
  }

  onMakeParent(tubeId) {
    this.props.onReparentTubes(tubeId, this.state.selection.map(tube => tube.id)).then(() => {
      // clear current selection after reparenting.
      this.updateSelection([], []);
    }).catch(reason => Notification.error({ message: reason }));
  }

  get scale() {
    return this.state.scale;
  }

  updateSelection(selectedRowKeys, selectedRows) {
    this.setState({
      selectedRowKeys,
      selection: selectedRows,
    });
  }

  render() {
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: '# of points',
        dataIndex: 'mesh',
        render: (mesh, tube) => (tube.status === 'done' ? mesh.length : '-'),
      },
      {
        title: '',
        dataIndex: '',
        render: (_, tube) => (
          tube.status === 'done' ?
            <span>
              <PopupColorPicker
                color={tube.color.map(c => c * 255)}
                onChange={rgb => this.props.onTubeColorChange(tube.id, rgb)}
              />
              <span className="ant-divider" />
              <Button onClick={() => this.props.onSetTubeVisibility(tube.id, !tube.visible)}>
                <i className={tube.visible ? 'fa fa-eye' : 'fa fa-eye-slash'} />
              </Button>
              <span className="ant-divider" />
              <Button onClick={() => this.props.onDeleteTube(tube.id)}>
                <i className="fa fa-trash" />
              </Button>
              <span className="ant-divider" />
              { this.state.selectedRowKeys.length > 0 ?
                <a href="#!" onClick={(ev) => { this.onMakeParent(tube.id); ev.preventDefault(); }}>
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

    const sliderLabel = (value, pos) => (
      <span style={{ lineHeight: 2.5 }}><label className={style.label}>Scale: </label>{value.toFixed(2)}</span>
    );

    const rowSelection = {
      selectedRowKeys: this.state.selectedRowKeys,
      onChange: (keys, rows) => this.updateSelection(keys, rows),
    };

    return (
      <div className={[style.horizontalContainer, style.controller].join(' ')}>
        <div className={[style.itemStretch, style.border].join(' ')}>
          <div>
            <LabeledSlider
              label={sliderLabel}
              className={style.slider}
              step={0.05}
              min={0}
              value={this.state.scale}
              max={20}
              onChange={scale => this.setState({ scale })}
            />
          </div>
        </div>
        <div className={[style.verticalContainer, style.itemStretch, style.border].join(' ')}>
          <div className={[style.itemStretch, style.overflowScroll].join(' ')}>
            <Table
              pagination={false}
              columns={columns}
              dataSource={this.state.tubeTree}
              rowSelection={rowSelection}
            />
          </div>
        </div>
      </div>
    );
  }
}

TubeController.propTypes = {
  tubes: PropTypes.array.isRequired,
  onSetTubeVisibility: PropTypes.func,
  onDeleteTube: PropTypes.func,
  onTubeColorChange: PropTypes.func,
  onReparentTubes: PropTypes.func,
};

TubeController.defaultProps = {
  onSetTubeVisibility: () => {},
  onDeleteTube: () => {},
  onTubeColorChange: () => {},
  onReparentTubes: () => {},
};
