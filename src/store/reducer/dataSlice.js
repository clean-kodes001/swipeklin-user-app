import {createSlice} from '@reduxjs/toolkit';
import {register} from '../actions/onboarding/register';
import {unAuthenticated} from '../actions/onboarding/unAuthenticated';
import {login} from '../actions/onboarding/login';
import {otpVerification} from '../actions/onboarding/otpVerification';
import {forgotPassword} from '../actions/onboarding/forgotPassword';
import {forgotPasswordOtpVerification} from '../actions/onboarding/forgotPasswordOtpVerification';
import {authenticated} from '../actions/onboarding/authenticated';

export const dataSlice = createSlice({
  name: 'data',
  initialState: {
    unAuthenticated: null,
    authenticated: null,
    error: null,
    pending: false,
    success: false,
  },

  reducers: {},
  extraReducers: builder => {
    builder.addCase(unAuthenticated.fulfilled, (state, action) => {
      state.unAuthenticated = action.payload;
      state.error = false;
    });
    builder.addCase(authenticated.rejected, (state, action) => {
      state.error = true;
      state.pending = false;
    });
    builder.addCase(authenticated.fulfilled, (state, action) => {
      state.authenticated = action.payload;
      state.error = false;
    });
    // builder.addCase(authenticated.pending, (state, action) => {
    // state.pending = true;
    // state.error = false;
    // });
  },
});

export const {} = dataSlice.actions;
export default dataSlice.reducer;
