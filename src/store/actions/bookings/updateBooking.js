import {createAsyncThunk} from '@reduxjs/toolkit';
import {BOOKINGS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

export const updateBooking = createAsyncThunk(
  'user/updateBooking',
  async ({data, id}) => {
    try {
      const {
        data: {booking},
      } = await Client({
        method: 'POST',
        path: `${BOOKINGS}/${id}`,
        data,
      });
      processSuccessMessage(
        data.status === 1
          ? 'Schedule activated successfully!'
          : data.status === 0
          ? 'Schedule deactivated successfully!'
          : '',
      );

      return booking;
    } catch (error) {
      throw error;
    }
  },
);
