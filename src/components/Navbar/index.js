import React from 'react';
import {
  Link
} from 'react-router-dom';

function Navbar() {

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <Link className="navbar-item" to="/home">Home</Link>
      <Link className="navbar-item" to="/game">Game</Link>
    </nav>
  );
}

export default Navbar;
