import {createSlice} from '@reduxjs/toolkit';
import {getPaginatedItems} from '../actions/user/getPaginatedItems';
import {getPayment} from '../actions/payment/getPayment';
import {getOnePayment} from '../actions/payment/getOnePayment';
import {getPaymentMethods} from '../actions/payment/getPaymentMethods';
import {deletePaymentMethod} from '../actions/payment/deletePaymentMethod';

export const paymentSlice = createSlice({
  name: 'history',
  initialState: {
    loading: false,
    error: null,
    allPending: false,
    pending: false,
    payments: [],
    paymentDetails: {},
    paymentData: null,
    paymentMethods: null,
  },

  reducers: {
    addPaymentMethod: (state, action) => {
      state.paymentMethods = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(getPayment.rejected, (state, action) => {
      state.allPending = false;
      state.error = true;
    });
    builder.addCase(getPayment.pending, (state, action) => {
      state.allPending = true;
      state.error = null;
    });
    builder.addCase(getPayment.fulfilled, (state, action) => {
      state.payments = action.payload;
      state.paymentData = action.payload.data;
      state.allPending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(deletePaymentMethod.rejected, (state, action) => {
      state.allPending = false;
      state.error = true;
    });
    builder.addCase(deletePaymentMethod.pending, (state, action) => {
      state.allPending = false;
      state.error = true;
    });
    builder.addCase(deletePaymentMethod.fulfilled, (state, action) => {
      state.paymentMethods = action.payload;
      state.allPending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(getPaymentMethods.rejected, (state, action) => {
      state.allPending = false;
      state.error = true;
    });
    builder.addCase(getPaymentMethods.pending, (state, action) => {
      state.paymentMethods = null;
      state.allPending = true;
      state.error = null;
    });
    builder.addCase(getPaymentMethods.fulfilled, (state, action) => {
      state.paymentMethods = action.payload;
      state.allPending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(getOnePayment.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(getOnePayment.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(getOnePayment.fulfilled, (state, action) => {
      state.paymentDetails = action.payload;

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

export const {addPaymentMethod} = paymentSlice.actions;
export default paymentSlice.reducer;
