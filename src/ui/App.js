import React from 'react';
import PropTypes from 'prop-types';

import style from '../Tube.mcss';


function App({ stores }) {
  return (
    <div className={style.reactRoot}>
    </div>
  );
}

App.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default App;
