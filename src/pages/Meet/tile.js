import React from 'react';
import './style.css';

function Tile(props) {

  return (
    <div className={"tile" + (props.idAttr === 'user-video' ? ' user': '') + (props.isHost === true ? ' host': '')}>
      <video 
        className="video" 
        id={props.idAttr} 
        autoPlay 
        playsInline
      />    
    </div>
  );
}

export default Tile;
