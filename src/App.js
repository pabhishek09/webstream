import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Meet from './pages/Meet';
import Navbar from './components/Navbar';
import 'bulma/css/bulma.min.css';
import './App.css';

function App() {

  return (
    <div className="app-container">
      <Router>
        <Navbar />
        <div className="container page-layout">
          <Switch>
            <Route path="/game">
              <Game />
            </Route>
            <Route path="/meet/:id">
              <Meet />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    </div>
  );
}

export default App;
