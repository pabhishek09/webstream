import { createSlice } from '@reduxjs/toolkit';

export const participantsSlice = createSlice({
  name: 'participants',
  initialState: [],
  reducers: {
    addParticipant: (state, action) => [ ...state, action.payload ],
    removeParticipant: (state, action) => {
    },
  }
});

export const { addParticipant, removeParticipant } = participantsSlice.actions;

export default participantsSlice.reducer;
