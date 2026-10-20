import {createAsyncThunk} from '@reduxjs/toolkit';
import {COUNTRY, HISTORY} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const getOnePayment = createAsyncThunk(
  'user/getOnePayment',
  async id => {
    try {
      const {
        data: {histories},
      } = await Client({
        method: 'GET',
        path: `${HISTORY}/${id}`,
      });

      return clean;
    } catch (error) {
      throw error;
    }
  },
);
