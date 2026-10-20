import {createSlice} from '@reduxjs/toolkit';
import {acceptAmend} from '../actions/dashboard/acceptAmend';
import {declineAmend} from '../actions/dashboard/declineAmend';
import {contactSupport} from '../actions/profile/contactSupport';
import {contactUs} from '../actions/profile/contactUs';

export const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    loading: false,
    error: null,
    pending: false,
    success: false,
    whichModal: null,
    successModalData: {},
  },

  reducers: {
    showSucessModal: (state, action) => {
      state.whichModal = action.payload.type;
      state.successModalData = action.payload.data;
    },
    closeModal: (state, action) => {
      state.whichModal = null;
      state.successModalData = {};
    },
  },
  extraReducers: builder => {
    builder.addCase(acceptAmend.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(acceptAmend.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(acceptAmend.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.success = true;
    });
    builder.addCase(declineAmend.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(declineAmend.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(declineAmend.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.success = true;
    });
    builder.addCase(contactSupport.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(contactSupport.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(contactSupport.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.success = true;
    });
    builder.addCase(contactUs.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(contactUs.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(contactUs.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.success = true;
    });
  },
});

export const {showModal, showSucessModal, closeModal} = uiSlice.actions;
export default uiSlice.reducer;
