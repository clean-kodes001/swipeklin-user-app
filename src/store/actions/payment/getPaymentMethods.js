import {createAsyncThunk} from '@reduxjs/toolkit';
import {PAYMENTMETHODS} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {logHelper} from '../../../utils/logHelper';

export const getPaymentMethods = createAsyncThunk(
  'user/getPaymentMethods',
  async () => {
    try {
      const {
        data: {payment},
      } = await Client({
        method: 'GET',
        path: PAYMENTMETHODS,
      });
      return payment;
    } catch (error) {
      throw error;
    }
  },
);
