import React from 'react';
import PropTypes from 'prop-types';

import { Button, Table, Slider } from 'antd';

import style from '../Tube.mcss';

export default class TubeController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 2,
    };
  }

  setScale(scale) {
    this.setState((prevState, props) => ({ scale }));
  }

  get piecewiseEditorContainer() {
    return this.volumeController;
  }

  get scale() {
    return this.state.scale;
  }

  resize() {
    // empty for now
  }

  render() {
    const columns = [
      {
        title: 'Position',
        dataIndex: 'position',
        key: 'position',
        render: pos => pos.join(', '),
      },
      {
        title: 'Number of points',
        dataIndex: 'mesh',
        key: 'mesh',
        render: mesh => mesh.length,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
      },
      {
        title: '',
        dataIndex: '',
        key: '',
        render: (_, tube) => (
          <span>
            <Button onClick={() => this.props.onSetTubeVisibility(tube.id, !tube.visible)}>
              <i className={tube.visible ? 'fa fa-eye' : 'fa fa-eye-slash'} />
            </Button>
            <span className="ant-divider" />
            <Button onClick={() => this.props.onDeleteTube(tube.id)}>
              <i className="fa fa-trash" />
            </Button>
          </span>
        ),
      },
    ];
    return (
      <div className={['js-controller', style.horizontalContainer, style.controller].join(' ')}>
        <div className={[style.verticalContainer, style.itemStretch, style.border].join(' ')}>
          <div className={style.horizontalContainer}>
            <label className={style.label}>Scale</label>
            <Slider
              ref={(r) => { this.scaleSlider = r; }}
              className={['js-scale', style.slider].join(' ')}
              step={0.05}
              min={0}
              value={this.state.scale}
              max={20}
              onChange={value => this.setScale(value)}
            />
          </div>
          <div className={['js-tubes', style.itemStretch, style.overflowScroll].join(' ')}>
            <Table pagination={false} columns={columns} dataSource={this.props.tubes} />
          </div>
        </div>
        <div
          ref={(r) => { this.volumeController = r; }}
          className={['js-volume-controller', style.verticalContainer, style.itemStretch, style.border].join(' ')}
        />
      </div>
    );
  }
}

TubeController.propTypes = {
  tubes: PropTypes.array.isRequired,
  onSetTubeVisibility: PropTypes.func,
  onDeleteTube: PropTypes.func,
};

TubeController.defaultProps = {
  onSetTubeVisibility: () => {},
  onDeleteTube: () => {},
};
