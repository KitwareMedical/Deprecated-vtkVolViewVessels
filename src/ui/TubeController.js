import React from 'react';
import PropTypes from 'prop-types';

import style from '../Tube.mcss';

export default class TubeController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      scale: 2,
    };
  }

  get piecewiseEditorContainer() {
    return this.volumeController;
  }

  updateScale() {
    this.setState((prevState, props) => ({ scale: Number(this.scaleSlider.value) / 10 }));
  }

  render() {
    const tubeRows = this.props.tubes.map(t =>
      (
        <tr key={t.id}>
          <td>{t.position}</td>
          <td>{t.mesh.length}</td>
          <td>{t.status}</td>
          <td>
            <button onClick={ev => this.props.onSetTubeVisibility(t.id, !t.visible)}>
              <i className={t.visible ? 'fa fa-eye' : 'fa fa-eye-slash'} />
            </button>
          </td>
          <td>
            <button onClick={ev => this.props.onDeleteTube(t.id)}>
              <i className="fa fa-trash" />
            </button>
          </td>
        </tr>
      ),
    );

    return (
      <div className={['js-controller', style.horizontalContainer, style.controller].join(' ')}>
        <div className={[style.verticalContainer, style.itemStretch, style.border].join(' ')}>
          <div className={style.horizontalContainer}>
            <label className={style.label}>Scale</label>
            <input
              ref={(r) => { this.scaleSlider = r; }}
              className={['js-scale', style.slider].join(' ')}
              type="range"
              min="0"
              value={this.state.scale * 10}
              max="100"
              onInput={ev => this.updateScale()}
            />
          </div>
          <div className={['js-tubes', style.itemStretch, style.overflowScroll].join(' ')}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Position</th>
                  <th># of points</th>
                  <th>Status</th>
                  <th><i className="fa fa-eye" /></th>
                  <th><i className="fa fa-trash" /></th>
                </tr>
              </thead>
              <tbody>
                {tubeRows}
              </tbody>
            </table>
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
