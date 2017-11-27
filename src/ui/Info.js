import React from 'react';
import PropTypes from 'prop-types';

import style from '../Tube.mcss';

function Info({ stores: { imageStore } }) {
  const image = imageStore.image;

  let infoText = 'No image loaded';
  if (image) {
    infoText = (
      <div style={{ marginTop: '10px' }}>
        <h2>Image Info</h2>
        <ul>
          <li>Bounds: {image.getBounds().join(', ')}</li>
          <li>Origin: {image.getOrigin().join(', ')}</li>
          <li>Spacing: {image.getSpacing().join(', ')}</li>
        </ul>
      </div>
    );
  }
  return (
    <div className={[style.horizontalContainer, style.controller].join(' ')}>
      <div className={[style.itemStretch, style.border].join(' ')}>
        {infoText}
      </div>
    </div>
  );
}

Info.propTypes = {
  stores: PropTypes.object.isRequired,
};

export default Info;
