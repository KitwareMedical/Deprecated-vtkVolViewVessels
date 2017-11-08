import React from 'react';
import PropTypes from 'prop-types';

import connect from '../state';
import style from '../Tube.mcss';

function Info({ image }) {
  return (
    <div className={[style.horizontalContainer, style.controller].join(' ')}>
      <div className={[style.itemStretch, style.border].join(' ')}>
        {
          image ?
            <div style={{ marginTop: '10px' }}>
              <h2>Image Info</h2>
              <ul>
                <li>Bounds: {image.getBounds().join(', ')}</li>
                <li>Origin: {image.getOrigin().join(', ')}</li>
                <li>Spacing: {image.getSpacing().join(', ')}</li>
              </ul>
            </div>
          :
            'No image loaded'
        }
      </div>
    </div>
  );
}

Info.propTypes = {
  image: PropTypes.object,
};

Info.defaultProps = {
  image: null,
};

export default connect(Info, 'image', (stores, props) => ({
  image: stores.image.data.image,
}));
