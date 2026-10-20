import {createAsyncThunk} from '@reduxjs/toolkit';
import {BOOKINGS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {getBookings} from './getBookings';
import i18n from '../../../i18n/i18n';

export const retryOccurrence = createAsyncThunk(
  'user/retryOccurrence',
  async ({id}, {dispatch}) => {
    try {
      const {
        data: {booking},
      } = await Client({
        method: 'POST',
        path: `${BOOKINGS}/${id}`,
        data: {retry: true},
      });
      processSuccessMessage(i18n.t('toasts.occurrence_retried'));
      // Refresh the list in the background; BookingDetails re-renders in place from
      // updatedBooking (set in the slice), same as cancelOccurrence.
      dispatch(getBookings());
      return booking;
    } catch (error) {
      throw error;
    }
  },
);
