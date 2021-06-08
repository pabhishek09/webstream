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
import store from './store';
import { Provider } from 'react-redux';

function App() {

  return (
    <div>
      <Provider store={store}>
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
      </Provider>
    </div>
  );
}

export default App;
