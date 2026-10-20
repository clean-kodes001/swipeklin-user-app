import {createAsyncThunk} from '@reduxjs/toolkit';
import {BOOKINGS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {getBookings} from './getBookings';
import i18n from '../../../i18n/i18n';

export const cancelOccurrence = createAsyncThunk(
  'user/cancelOccurrence',
  async ({id}, {dispatch}) => {
    try {
      const {
        data: {booking},
      } = await Client({
        method: 'POST',
        path: `${BOOKINGS}/${id}`,
        data: {cancel_occurrence: true},
      });
      processSuccessMessage(i18n.t('toasts.occurrence_cancelled'));
      // Refresh the list in the background; BookingDetails re-renders in place from
      // updatedBooking (set in the slice), so no navigation.goBack() — the user sees
      // the cancelled date move into the "Cancelled" section.
      dispatch(getBookings());
      return booking;
    } catch (error) {
      throw error;
    }
  },
);
