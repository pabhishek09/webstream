import { createSlice } from '@reduxjs/toolkit';

export const connectionSlice = createSlice({
  name: 'connection',
  initialState: {
    meetingId: '',
    host: {
      id: '',
      name: '',
    },
    participant: {
      name: '',
      id: '',
      isHost: null,
    }
  },
  reducers: {
    setConnectionState: (state, action) => {
      state[action.payload.attr] = action.payload.value;
    },
  }
});

export const { setConnectionState } = connectionSlice.actions;

export default connectionSlice.reducer;
