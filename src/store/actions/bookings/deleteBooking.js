import {createAsyncThunk} from '@reduxjs/toolkit';
import {BOOKINGS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {getBookings} from './getBookings';
import i18n from '../../../i18n/i18n';

export const deleteBooking = createAsyncThunk(
  'user/deleteBooking',
  async ({data, id, navigation}, {dispatch}) => {
    try {
      const {
        data: {booking},
      } = await Client({
        method: 'POST',
        path: `${BOOKINGS}/${id}`,
        data,
      });
      processSuccessMessage(i18n.t('toasts.booking_deleted'));
      dispatch(getBookings());
      navigation.goBack();
      return booking;
    } catch (error) {
      throw error;
    }
  },
);
