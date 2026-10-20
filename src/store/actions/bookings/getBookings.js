import {createAsyncThunk} from '@reduxjs/toolkit';
import {BOOKINGS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logHelper} from '../../../utils/logHelper';

export const getBookings = createAsyncThunk('user/getBookings', async () => {
  try {
    const {
      data: {bookings},
    } = await Client({
      method: 'GET',
      path: BOOKINGS,
    });

    return bookings;
  } catch (error) {
    throw error;
  }
});
