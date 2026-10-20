import {createSlice} from '@reduxjs/toolkit';
import {getHistory} from '../actions/history/getHistory';
import {getOneHistory} from '../actions/history/getOneHistory';
import {getPaginatedItems} from '../actions/user/getPaginatedItems';
import {getBookings} from '../actions/bookings/getBookings';
import {getOneBooking} from '../actions/bookings/getOneBooking';
import {updateBooking} from '../actions/bookings/updateBooking';
import {editBookings} from '../actions/bookings/editBookings';
import {deleteBooking} from '../actions/bookings/deleteBooking';
import {cancelOccurrence} from '../actions/bookings/cancelOccurrence';
import {retryOccurrence} from '../actions/bookings/retryOccurrence';

export const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    loading: false,
    error: null,
    allPending: false,
    pending: false,
    pendingDelete: false,
    pendingCancel: false,
    pendingRetry: false,
    bookings: [],
    bookingDetails: {},
    bookingsData: null,
    updatedBooking: null,
  },

  reducers: {
    clearUpdatedBooking: (state, action) => {
      state.updatedBooking = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(getBookings.rejected, (state, action) => {
      state.allPending = false;
      state.error = true;
    });
    builder.addCase(getBookings.pending, (state, action) => {
      state.allPending = true;
      state.error = null;
    });
    builder.addCase(getBookings.fulfilled, (state, action) => {
      state.bookings = action.payload;
      state.bookingsData = action.payload.data;
      state.allPending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(updateBooking.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(updateBooking.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(updateBooking.fulfilled, (state, action) => {
      state.updatedBooking = action.payload;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(editBookings.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(editBookings.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(editBookings.fulfilled, (state, action) => {
      // state.updatedBooking = action.payload;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(deleteBooking.rejected, (state, action) => {
      state.pendingDelete = false;
      state.error = true;
    });
    builder.addCase(deleteBooking.pending, (state, action) => {
      state.pendingDelete = true;
      state.error = null;
    });
    builder.addCase(deleteBooking.fulfilled, (state, action) => {
      // state.updatedBooking = action.payload;
      state.pendingDelete = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(cancelOccurrence.rejected, (state, action) => {
      state.pendingCancel = false;
      state.error = true;
    });
    builder.addCase(cancelOccurrence.pending, (state, action) => {
      state.pendingCancel = true;
      state.error = null;
    });
    builder.addCase(cancelOccurrence.fulfilled, (state, action) => {
      // The controller returns the fresh clean_group (updated skip_dates + recomputed
      // next_schedule_date), so updating updatedBooking refreshes BookingDetails in place.
      state.updatedBooking = action.payload;
      state.pendingCancel = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(retryOccurrence.rejected, (state, action) => {
      state.pendingRetry = false;
      state.error = true;
    });
    builder.addCase(retryOccurrence.pending, (state, action) => {
      state.pendingRetry = true;
      state.error = null;
    });
    builder.addCase(retryOccurrence.fulfilled, (state, action) => {
      // Same pattern as cancelOccurrence: controller returns the fresh clean_group
      // (last_failure_reason cleared, needs_attention now false), so BookingDetails
      // refreshes in place.
      state.updatedBooking = action.payload;
      state.pendingRetry = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(getOneBooking.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(getOneBooking.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(getOneBooking.fulfilled, (state, action) => {
      state.bookingDetails = action.payload;

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

export const {clearUpdatedBooking} = bookingsSlice.actions;
export default bookingsSlice.reducer;
