import { configureStore } from '@reduxjs/toolkit';
import connectionReducer from './connection';
import participantsReducer from './participants';

export default configureStore({
  reducer: {
    connection: connectionReducer,
    participants: participantsReducer,
  }
});
