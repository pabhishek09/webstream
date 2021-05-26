import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Meet from './pages/Meet';
import './App.css';

function App() {

  return (
    <div>
      <Router>
        <div className="container max-w-full min-h-screen bg-purple m-0">
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
