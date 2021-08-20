import React from 'react';
import HostIcon from '../../assets/icons/source_icons_host.svg';
import './style.css';

function Tile(props) {

  return (
    <div className="tile-container" id={`tile-${props.idAttr}`}>
      <div className="participant-details">
        {props.isHost && <TileIcon src={HostIcon} alt='host-icon'/>}
        <span>{props.name}</span>{props.idAttr === 'user-video' && <span>(me)</span>}
      </div>
      <div className={"participant-video" + (props.idAttr === 'user-video' ? ' user': '') + (props.isHost === true ? ' host': '')}>
        <video 
          className="video" 
          id={props.idAttr} 
          autoPlay 
          playsInline
        />    
      </div>
    </div>
  );
}

export default Tile;

const TileIcon = ({src, alt}) => {
  return (
    <img className="px-2 tile-icon" src={src} alt={alt}/>
  )
}
