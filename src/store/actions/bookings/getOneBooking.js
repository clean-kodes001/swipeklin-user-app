import {createAsyncThunk} from '@reduxjs/toolkit';
import {COUNTRY, HISTORY} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const getOneBooking = createAsyncThunk(
  'user/getOneBooking',
  async id => {
    try {
      const {
        data: {clean},
      } = await Client({
        method: 'GET',
        path: `Bookings/${id}`,
      });

      return clean;
    } catch (error) {
      throw error;
    }
  },
);
