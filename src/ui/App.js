import React from 'react';
import PropTypes from 'prop-types';

import style from '../Tube.mcss';

import ControllableSliceView from './ControllableSliceView';

function App({ stores }) {
  return (
    <div className={style.reactRoot}>
      <div className={[style.vtkViewer, style.horizontalContainer, style.itemStretch].join(' ')}>
        <ControllableSliceView stores={stores} />
      </div>
    </div>
  );
}

App.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default App;
