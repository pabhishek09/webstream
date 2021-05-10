import React from 'react';
import './style.css';

function Feed(props) {

  return (
    <div className="feed-container">
      <video 
        className={"feed-content" + (props.idAttr === 'user-video' ? ' user-feed': '')} 
        id={props.idAttr} 
        autoPlay 
        playsInline
      />    
    </div>
  );
}

export default Feed;
