import {createSlice} from '@reduxjs/toolkit';
import {getHistory} from '../actions/history/getHistory';
import {getOneHistory} from '../actions/history/getOneHistory';
import {getPaginatedItems} from '../actions/user/getPaginatedItems';

export const historySlice = createSlice({
  name: 'history',
  initialState: {
    loading: false,
    error: null,
    allPending: false,
    pending: false,
    history: [],
    historyDetails: {},
    historyData: null,
  },

  reducers: {
    // clearRoom: (state, action) => {
    //   state.chats = [];
    // },
  },
  extraReducers: builder => {
    builder.addCase(getHistory.rejected, (state, action) => {
      state.allPending = false;
      state.error = true;
    });
    builder.addCase(getHistory.pending, (state, action) => {
      state.allPending = true;
      state.error = null;
    });
    builder.addCase(getHistory.fulfilled, (state, action) => {
      state.history = action.payload;
      state.historyData = action.payload.data;
      state.allPending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(getOneHistory.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(getOneHistory.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(getOneHistory.fulfilled, (state, action) => {
      state.historyDetails = action.payload;

      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(getPaginatedItems.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(getPaginatedItems.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(getPaginatedItems.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.success = true;
    });
  },
});

export const {} = historySlice.actions;
export default historySlice.reducer;
