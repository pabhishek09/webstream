import { configureStore } from '@reduxjs/toolkit';
import connectionReducer from './connection';

export default configureStore({
  reducer: {
    connection: connectionReducer,
  }
});


