import {createAsyncThunk} from '@reduxjs/toolkit';
import {BOOKINGS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import i18n from '../../../i18n/i18n';

export const editBookings = createAsyncThunk(
  'user/editBookings',
  async ({data, id, navigation}) => {
    try {
      const {
        data: {booking},
      } = await Client({
        method: 'POST',
        path: `${BOOKINGS}/${id}`,
        data,
      });

      processSuccessMessage(i18n.t('toasts.booking_edited'));
      navigation.replace('dashboard', {screen: 'Bookings'});
      return booking;
    } catch (error) {
      // console.log(error);
      throw error;
    }
  },
);
