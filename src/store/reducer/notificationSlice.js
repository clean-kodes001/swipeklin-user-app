import {createSlice} from '@reduxjs/toolkit';

export const notificationSlice = createSlice({
  name: 'bookings',
  initialState: {
    loading: false,
    error: null,
    allPending: false,
    pending: false,

    notify: null,
  },

  reducers: {
    setNotify: (state, action) => {
      state.notify = true;
    },
  },
  extraReducers: builder => {
    // builder.addCase(getPaginatedItems.pending, (state, action) => {
    //   state.pending = true;
    //   state.error = null;
    // });
    // builder.addCase(getPaginatedItems.rejected, (state, action) => {
    //   state.pending = false;
    //   state.error = true;
    // });
    // builder.addCase(getPaginatedItems.fulfilled, (state, action) => {
    //   state.pending = false;
    //   state.error = null;
    //   state.success = true;
    // });
  },
});

export const {setNotify} = notificationSlice.actions;
export default notificationSlice.reducer;
