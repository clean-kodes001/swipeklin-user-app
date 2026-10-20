import {createSlice} from '@reduxjs/toolkit';
import {completeProfile} from '../actions/profile/completeProfile';
import {uploadProfile} from '../actions/profile/uploadProfile';
import {uploadImage} from '../actions/profile/uploadImage';
import {register} from '../actions/onboarding/register';
import {login} from '../actions/onboarding/login';
import {goToImageStep} from '../actions/profile/goToImageStep';

export const profileSlice = createSlice({
  name: 'user',
  initialState: {
    completeProfileStage: null,
    avatar: null,
    avatarUri: null,
    error: null,
    pending: false,
    success: false,
  },

  reducers: {
    logOut: (state, action) => {
      state.completeProfileStage = null;
      state.avatar = null;
    },
    next: (state, action) => {
      // state.completeProfileStage = state.completeProfileStage + 1;
    },
    setStage: (state, action) => {
      // state.completeProfileStage = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(completeProfile.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(completeProfile.fulfilled, (state, action) => {
      state.completeProfileStage = action.payload.nextStage;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(completeProfile.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(uploadProfile.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(uploadProfile.fulfilled, (state, action) => {
      state.completeProfileStage = action.payload?.nextStage || 3;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(uploadProfile.rejected, (state, action) => {
      state.avatar = action.payload?.avatar;
      state.pending = false;
      state.error = true;
      state.completeProfileStage = 3;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.completeProfileStage = 2;
      state.avatarUri = action.payload?.avatar;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.completeProfileStage = !action.payload?.first_name
        ? 2
        : !action.payload?.document
        ? 3
        : 3;
      state.avatarUri = action.payload?.avatar;
    });

    builder.addCase(uploadImage.fulfilled, (state, action) => {
      state.completeProfileStage = action.payload.nextStage;
      state.avatar = action.payload?.avatar;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(goToImageStep.fulfilled, (state, action) => {
      state.completeProfileStage = action.payload.nextStage;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
  },
});

export const {next, setStage} = profileSlice.actions;
export default profileSlice.reducer;
