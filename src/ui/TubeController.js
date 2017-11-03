import React from 'react';
import PropTypes from 'prop-types';

import { Button, Table } from 'antd';

import LabeledSlider from './components/LabeledSlider';
import PopupColorPicker from './PopupColorPicker';
import style from '../Tube.mcss';

export default class TubeController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 2,
    };
  }

  get scale() {
    return this.state.scale;
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
            </span>
            :
            <Spin />
        ),
      },
    ];

    const sliderLabel = (value, pos) => (
      <span style={{ lineHeight: 2.5 }}><label className={style.label}>Scale: </label>{value.toFixed(2)}</span>
    );

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
            <Table pagination={false} columns={columns} dataSource={this.props.tubes} />
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
};

TubeController.defaultProps = {
  onSetTubeVisibility: () => {},
  onDeleteTube: () => {},
  onTubeColorChange: () => {},
};
