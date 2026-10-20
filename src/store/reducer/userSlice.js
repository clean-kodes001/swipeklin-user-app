import {createSlice} from '@reduxjs/toolkit';
import {register} from '../actions/onboarding/register';
import {unAuthenticated} from '../actions/onboarding/unAuthenticated';
import {login} from '../actions/onboarding/login';
import {otpVerification} from '../actions/onboarding/otpVerification';
import {forgotPassword} from '../actions/onboarding/forgotPassword';
import {forgotPasswordOtpVerification} from '../actions/onboarding/forgotPasswordOtpVerification';
import {uploadProfile} from '../actions/profile/uploadProfile';
import {uploadUserProfile} from '../actions/profile/uploadUserProfile';
import {cleanCalculate} from '../actions/dashboard/cleanCalculate';
import {clean} from '../actions/dashboard/clean';
import {rateCleaner} from '../actions/dashboard/rateCleaner';
import {getClean} from '../actions/dashboard/getClean';
import {cancelClean} from '../actions/dashboard/cancelClean';
import {endClean} from '../actions/dashboard/endClean';
import {contactMe} from '../actions/dashboard/contactMe';
import {getPaginatedItems} from '../actions/user/getPaginatedItems';
import {secureProfileEdit} from '../actions/profile/secureProfileEdit';
import {getProfile} from '../actions/profile/getProfile';
import {declineAmend} from '../actions/dashboard/declineAmend';
import {acceptAmend} from '../actions/dashboard/acceptAmend';
import {retryClean} from '../actions/dashboard/retryClean';

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    completedOnboarding: false,
    unAuthenticated: null,
    error: null,
    pending: false,
    pendingRating: null,
    pendingTipCleanAmount: 0,
    profilePending: false,
    success: false,
    clean: null,
    cleanCalculateData: null,
    cleanCanceled: null,
    shouldShowContactMeModal: false,
    searchTimerResetTime: null,
    requestOppParty: null,
    amendRequest: null,
    cleanersLocation: null,
    amendRequestTime: null,
    arrivedState: null,
    serverTimeOffset: 0,
    messageCount: 0,
  },

  reducers: {
    completeOnboarding: (state, action) => {
      state.completedOnboarding = true;
    },
    setCleanerslocation: (state, action) => {
      state.cleanersLocation = action.payload;
    },
    logOut: (state, action) => {
      state.user = null;
      state.shouldShowContactMeModal = false;
      state.messageCount = 0;
      // The user slice is persisted to AsyncStorage, so a cleaner's last known position
      // used to outlive its clean (and the session) and seed the next job's distance.
      state.cleanersLocation = null;
    },
    resetCleanRequest: (state, action) => {
      state.pendingTipCleanAmount = state.clean?.amount || 0;
      state.pendingRating = action.payload?.id;
      state.clean = null;
      state.requestOppParty = null;
      state.amendRequest = null;
      state.messageCount = 0;
      state.shouldShowContactMeModal = false;
      state.amendRequestTime = null;
      state.cleanersLocation = null;
    },
    clearCleanRequest: (state, action) => {
      state.clean = null;
      state.requestOppParty = null;
      state.amendRequest = null;
      state.shouldShowContactMeModal = false;
      state.messageCount = 0;
      state.amendRequestTime = null;
      state.cleanersLocation = null;
    },
    clearPendingRatings: (state, action) => {
      state.pendingRating = null;
      state.pendingTipCleanAmount = 0;
    },
    // Narrow, non-destructive setter used when a "cleaning ended" push notification
    // is tapped from a cold start (no live Pusher event was received). Unlike
    // resetCleanRequest, this must NOT touch state.clean/requestOppParty/etc. — the
    // notification may be stale and the user could already be on a different active
    // clean by the time it's tapped.
    setPendingRatingFromNotification: (state, action) => {
      state.pendingRating = action.payload;
    },
    setRequestOppParty: (state, action) => {
      state.requestOppParty = action.payload;
    },
    showContactMeModalAction: (state, action) => {
      state.shouldShowContactMeModal = true;
    },
    hideContactMeModalAction: (state, action) => {
      state.shouldShowContactMeModal = false;
    },
    resetCleanCanceled: (state, action) => {
      state.cleanCanceled = null;
    },
    removeClean: (state, action) => {
      state.clean = null;
      state.requestOppParty = null;
      state.shouldShowContactMeModal = false;
      state.messageCount = 0;
      state.cleanersLocation = null;
    },
    updateClean: (state, action) => {
      state.clean = action.payload;
    },
    setAmendRequest: (state, action) => {
      state.amendRequest = action.payload;
      state.clean = action.payload;
      if (action.payload?.clean_cleaners_status === 3) {
      }
    },
    incrementMessageCount: (state, action) => {
      state.messageCount = (state.messageCount || 0) + 1;
    },
    setMessageCount: (state, action) => {
      state.messageCount = action.payload;
    },
    decrementMessageCount: (state, action) => {
      state.messageCount = Math.max(0, (state.messageCount || 0) - (action.payload || 1));
    },
  },
  extraReducers: builder => {
    builder.addCase(unAuthenticated.fulfilled, (state, action) => {
      state.unAuthenticated = action.payload;
      state.pending = null;
      state.pendingRating = null;
      state.profilePending = null;
    });

    builder.addCase(declineAmend.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(declineAmend.fulfilled, (state, action) => {
      state.pending = false;
      state.success = true;
      state.error = null;
      state.amendRequestTime = null;
      state.amendRequest = null;
      state.clean = action.payload;
       state.shouldShowContactMeModal = false;
    });
    builder.addCase(declineAmend.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
      state.clean = null;
    });
    builder.addCase(acceptAmend.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(acceptAmend.fulfilled, (state, action) => {
      state.pending = false;
      state.success = true;
      state.error = null;
      state.amendRequestTime = null;
      state.amendRequest = null;
      state.clean = action.payload;
      state.shouldShowContactMeModal = false;
    });
    builder.addCase(acceptAmend.rejected, (state, action) => {
      state.pending = false;
      state.clean = null;
      state.error = true;
    });

    builder.addCase(contactMe.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(contactMe.fulfilled, (state, action) => {
      state.pending = false;
      state.success = true;
      state.error = null;
      state.shouldShowContactMeModal = false;
      state.clean = null;
      state.requestOppParty = null;
    });
    builder.addCase(contactMe.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(otpVerification.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(otpVerification.fulfilled, (state, action) => {
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(otpVerification.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(forgotPasswordOtpVerification.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(
      forgotPasswordOtpVerification.fulfilled,
      (state, action) => {
        state.pending = false;
        state.success = true;
        state.error = null;
      },
    );
    builder.addCase(forgotPasswordOtpVerification.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(register.pending, (state, action) => {
      state.pending = true;
      state.error = null;
      state.clean = null;
      state.requestOppParty = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.user = action.payload;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(forgotPassword.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.fulfilled, (state, action) => {
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(forgotPassword.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });

    builder.addCase(login.pending, (state, action) => {
      state.pending = true;
      state.error = null;
      state.clean = null;
      state.requestOppParty = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.user = action.payload;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(uploadProfile.fulfilled, (state, action) => {
      state.user = action.payload?.user || state.user;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(uploadUserProfile.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(uploadUserProfile.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(uploadUserProfile.fulfilled, (state, action) => {
      state.user = action.payload || state.user;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(secureProfileEdit.rejected, (state, action) => {
      state.pending = false;
      state.error = true;
    });
    builder.addCase(secureProfileEdit.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(secureProfileEdit.fulfilled, (state, action) => {
      state.user = action.payload;
      state.pending = false;
      state.success = true;
      state.error = null;
    });
    builder.addCase(cleanCalculate.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(cleanCalculate.rejected, (state, action) => {
      state.pending = false;
      state.error = null;
    });
    builder.addCase(cleanCalculate.fulfilled, (state, action) => {
      state.pending = false;
      state.cleanCalculateData = action.payload;

      state.requestOppParty = null;
      state.error = null;
    });
    builder.addCase(clean.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(clean.rejected, (state, action) => {
      state.pending = false;
      state.error = null;
    });
    builder.addCase(clean.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.clean = action.payload;
      state.shouldShowContactMeModal = false;
    });
    builder.addCase(getClean.pending, (state, action) => {
      // Silent refresh - don't set pending to avoid loader flash
      // state.pending = true;
      // state.error = null;
    });
    builder.addCase(getClean.rejected, (state, action) => {
      state.pending = false;
      state.error = null;
    });
    builder.addCase(getClean.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;

      const incomingClean = action.payload?.clean;
      const hasActiveWorker =
        Array.isArray(incomingClean?.clean_cleaners) &&
        incomingClean.clean_cleaners.some(c =>
          [1, 3, 4, 7, 10, 11].includes(c?.status),
        );
      // Only clear the "no cleaner found" modal once a cleaner is actually assigned — NOT on a
      // silent refetch while still searching. That race (getClean wiping the flag the timer just
      // set) is why the timeout dialog never showed. Explicit actions (new request / retry /
      // contact / cancel / hideContactMeModalAction) still clear it in their own reducers.
      if (hasActiveWorker) {
        state.shouldShowContactMeModal = false;
      }
      
      // Only set messageCount if cleaners are matched
      if (action.payload?.clean?.clean_cleaners?.length > 0) {
        state.messageCount = action.payload?.unread_chat_count || 0;
      } else {
        state.messageCount = 0;
      }
      
      // On timeout the clean is terminated server-side (status 8) and GET /clean returns null.
      // Don't null it out from under the "no cleaner found" modal, or CleanDetails (which hosts
      // the modal) unmounts before the user can act on it — keep the clean (and its id) mounted.
      if (incomingClean == null && state.shouldShowContactMeModal) {
        // preserve the existing state.clean
      } else {
        state.clean = incomingClean;
      }

      // Calculate server time offset to fix clock skew
      // Try to get server time from payload or headers if passed
      // Since we don't have direct access to headers here easily without changing getClean return,
      // we'll use a heuristic: assume 'updated_at' is reasonably fresh or use current device time if not available.
      // BETTER APPROACH based on USER PROMPT: The user likely wants us to implement the offset calculation.
      // We will look for a timestamp in the payload. If not present, we will rely on device time for now 
      // BUT structurally prepare the state.
      // However, to strictly follow the prompt "When API returns a timestamp...":
      // We will assume 'updated_at' is the closest proxy if headers aren't piped through.
      // Let's modify getClean to pass the 'Date' header if possible. 
      // But first let's store the offset if we can calculate it.
      
      if (action.payload?.server_time) {
         state.serverTimeOffset = new Date(action.payload.server_time).getTime() - Date.now();
      }
      
      if (action.payload?.clean?.clean_amend?.status === 0 && !state.amendRequestTime) {
        // Use server-adjusted time for consistency with timer calculations
        const now = Date.now() + (state.serverTimeOffset || 0);
        state.amendRequestTime = new Date(now).toISOString();
      }
      if (
        action.payload?.clean?.clean_cleaners_status === 3 &&
        !state?.arrivedState
      ) {
        state.arrivedState =
          action.payload?.clean?.clean_cleaners_status_time?.['t3'] ??
          new Date().toISOString();
      } else if (
        action.payload?.clean?.clean_cleaners_status !== 3 &&
        state?.arrivedState
      ) {
        state.arrivedState = null;
      }
    });
    builder.addCase(rateCleaner.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(rateCleaner.rejected, (state, action) => {
      state.pending = false;
      state.error = null;
    });
    builder.addCase(rateCleaner.fulfilled, (state, action) => {
      state.error = null;
      state.pending = false;
      state.pendingRating = false;
    });
    builder.addCase(cancelClean.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(cancelClean.rejected, (state, action) => {
      state.pending = false;
      state.error = null;
    });
    builder.addCase(cancelClean.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.clean = null;
      state.requestOppParty = null;
      state.cleanCanceled = true;
      state.shouldShowContactMeModal = false;
      state.messageCount = 0;
    });
    builder.addCase(endClean.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(endClean.rejected, (state, action) => {
      state.pending = false;
      state.error = null;
    });
    builder.addCase(endClean.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.pendingTipCleanAmount = state.clean?.amount || 0;
      state.pendingRating = {...state.clean}.id;
      state.clean = null;
      state.requestOppParty = null;
      state.amendRequest = null;
      state.messageCount = 0;
    });
    builder.addCase(getProfile.pending, (state, action) => {
      state.profilePending = true;
      state.error = null;
    });
    builder.addCase(getProfile.rejected, (state, action) => {
      state.profilePending = false;
      state.error = null;
    });
    builder.addCase(getProfile.fulfilled, (state, action) => {
      state.profilePending = false;
      state.error = null;
      state.user = action.payload;
    });

    // retryClean - user taps "Try Again" button
    builder.addCase(retryClean.pending, (state, action) => {
      state.pending = true;
      state.error = null;
    });
    builder.addCase(retryClean.rejected, (state, action) => {
      state.pending = false;
      state.error = action.error?.message || 'Failed to retry';
    });
    builder.addCase(retryClean.fulfilled, (state, action) => {
      state.pending = false;
      state.error = null;
      state.clean = action.payload;
      state.shouldShowContactMeModal = false;
    });
  },
});

export const {
  completeOnboarding,
  setCleanerslocation,
  removeClean,
  updateClean,
  setAmendRequest,
  logOut,
  resetCleanCanceled,
  showContactMeModalAction,
  hideContactMeModalAction,
  resetCleanRequest,
  clearCleanRequest,
  clearPendingRatings,
  setPendingRatingFromNotification,
  setRequestOppParty,
  incrementMessageCount,
  setMessageCount,
  decrementMessageCount,
} = userSlice.actions;
export default userSlice.reducer;
